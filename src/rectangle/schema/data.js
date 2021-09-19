import * as Joi from 'joi';

const eventSchema = Joi.object({
  date: Joi.string().allow(''), // TODO validate
  place: Joi.string().allow(''),
});

const idSchema = Joi.string();

const individualSchema = {
  surname: Joi.string().allow(''),
  givenName: Joi.string().allow(''),
  birthEvent: eventSchema,
  deathEvent: eventSchema,
}

const familySchema = Joi.object({
  unionEvent: eventSchema,
  husbandIndividualId: idSchema,
  wifeIndividualId: idSchema,
}).required();

function requiredIdMapSchema(valuesSchema) {
  return Joi.object().pattern(/^.+/, valuesSchema).required();
}

export const dataSchema = Joi.object({
  rootIndividualId: Joi.string(),
  individuals: requiredIdMapSchema(individualSchema), // Keyed array of individuals
  families: requiredIdMapSchema(familySchema), // Keyed array of families
  ascendingRelation: requiredIdMapSchema(idSchema.required()), // Map individualId -> family
  descendingRelation: requiredIdMapSchema(requiredIdMapSchema(Joi.array().items(idSchema.required()).required())), // Map individualId -> families with children
});
