import type { NextFunction, Request, Response } from "express";
import z from "zod";
import { HttpClientError } from "../lib/errors.ts";

// on a besoin que next reste dans notre prototypage, cependant eslint considère ça comme une erreur, donc on va demander à eslint d'ignorer cette ligne
export function globalErrorHandler(error: Error, req: Request, res: Response, next: NextFunction) { // eslint-disable-line
  console.error('Internal server error', error);

  // les erreurs de zod (erreur de typage)
  if (error instanceof z.ZodError) {
    console.info('ZodError', error);
    return res.status(400).json({
      status: 400,
      error: z.prettifyError(error)
    });
  }


  // les erreurs client controlées (notfound conflicterror)
  if (error instanceof HttpClientError) {
    // console.info permet d'avoir des infos dans la console de l'API
    console.info('HttpClientError', error.name, error.message);
        
    // res.status permet d'envoyer l'erreur au client
    return res.status(error.status).json({
      status: error.status,
      error: error.message
    });
  }

  // toutes les autres erreurs (donc 500 - internal server error
  res.status(500).json({
    status: 500,
    error: 'Internal server error'
  });
}