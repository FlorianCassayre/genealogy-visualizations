import * as Joi from 'joi';
import { ORIENTATION_HORIZONTAL, ORIENTATION_VERTICAL } from '../../common';

export const layersSchema = Joi.object({
  unions: Joi.object({
    enabled: Joi.boolean().default(true),
  }).default(),
  dates: Joi.object({
    //unions: Joi.object(),
  }).default(),
  texts: Joi.array()/*.min(1)*/.items(Joi.object({
    value: Joi.alternatives(
      Joi.string(), // Data field name
      Joi.function(), // Function `object => string`
    ).required(),
    // alignment etc.
    // text formatter
  })).default([
    { value: 'surname' },
    { value: 'given_name' },
  ]),
  textSize: Joi.number().positive().default(10),
  textLength: Joi.number().positive().default(50),
  orientation: Joi.string().valid(ORIENTATION_HORIZONTAL, ORIENTATION_VERTICAL).default(ORIENTATION_HORIZONTAL),
  padding: Joi.object({
    sides: Joi.number().positive().default(10),
    top: Joi.number().positive().default(10),
    bottom: Joi.number().positive().default(10),
    textSpacing: Joi.number().positive().default(10),
  }).default(),
}).required();

export const configSchema = Joi.object({
  generations: Joi.object({
    ascending: Joi.number().integer().positive().default(5),
    descending: Joi.number().integer().positive().default(5),
  }).default(),
  layers: Joi.object().pattern(/^0|[1-9][0-9]*/, layersSchema.options({ noDefaults: true })).default(),
  margin: Joi.object({
    sides: Joi.number().positive().default(25),
    top: Joi.number().positive().default(25),
    bottom: Joi.number().positive().default(25),
  }).default(),
  style: Joi.object().default(),
}).required().default();
