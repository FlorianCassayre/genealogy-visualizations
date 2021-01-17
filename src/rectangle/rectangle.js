import { adaptTextSize, createElement, createSVG, deepMerge } from '../util';
import * as Joi from 'joi';

// Data

const eventSchema = Joi.object({
    date: Joi.string(), // TODO validate
    place: Joi.string(),
});

const individualSchema = Joi.object({
    surname: Joi.string(),
    givenName: Joi.string(),
    birthEvent: eventSchema,
    deathEvent: eventSchema,
    parents: Joi.object({
        unionEvent: eventSchema,
        husbandIndividualId: Joi.string(),
        wifeIndividualId: Joi.string(),
    }),
}).required();

const dataSchema = Joi.object({
    rootIndividualId: Joi.string(),
    individuals: Joi.object().pattern(/^.+/, individualSchema).required(),
});

// Config

const colorsSchema = Joi.object({

});

const ORIENTATION_HORIZONTAL = 'horizontal';
const ORIENTATION_VERTICAL = 'vertical';

const layersShape = {
    unions: Joi.object({
        enabled: Joi.boolean().default(true),
    }).default(),
    dates: Joi.object({
        //unions: Joi.object(),
    }).default(),
    rows: Joi.object({
        texts: Joi.array().min(1).items(Joi.object({
            value: Joi.alternatives(
                Joi.string(), // Data field name
                Joi.function(), // Function `object => string`
            ).required(),
            // alignment etc.
        })).default([
            { value: 'surname' },
            { value: 'given_name' },
        ]),
        textSize: Joi.number().positive().default(50),
        orientation: Joi.string().valid(ORIENTATION_HORIZONTAL, ORIENTATION_VERTICAL).default(ORIENTATION_HORIZONTAL),
        margin: Joi.object({
            horizontalSpacing: Joi.number().positive().default(15),
            verticalSpacing: Joi.number().positive().default(20),
        }).default(),
        padding: Joi.object({
            sides: Joi.number().positive().default(10),
            top: Joi.number().positive().default(10),
            bottom: Joi.number().positive().default(10),
            textSpacing: Joi.number().positive().default(10),
        }).default(),
    }).default(),
};

const configSchema = Joi.object({
    generations: Joi.number().integer().default(5),
    layers: Joi.object({
        ...layersShape,
        override: Joi.object().pattern(/^[1-9][0-9]*/, Joi.object(layersShape).options({ noDefaults: true })).default(),
    }).default(),
    width: Joi.number().positive().default(1000),
    margin: Joi.object({
        sides: Joi.number().positive().default(25),
        top: Joi.number().positive().default(25),
        bottom: Joi.number().positive().default(25),
    }).default(),
    style: Joi.object().default(),
}).required().default();

function computeDepth(data) {
    // Does not support cycles / is efficient for trees only
    let individualIds = new Set([data.rootIndividualId]);
    let isEmpty;
    let depth = 0;
    do {
        isEmpty = true;
        const parentIndividualIds = new Set();
        for(const individualId of individualIds.values()) {
            if(individualId != null) {
                const individual = data.individuals[individualId];
                if (individual != null) {
                    isEmpty = false;
                    const parents = individual.parents;
                    parentIndividualIds.add(parents.husbandIndividualId);
                    parentIndividualIds.add(parents.wifeIndividualId);
                }
            }
        }
        if(!isEmpty) {
            depth += 1;
        }
        individualIds = parentIndividualIds;
    } while (!isEmpty);
    return depth;
}

function getOverridableConfig(configValue, i) {
    return deepMerge(configValue, configValue.override[i] || {});
}

function getLayerConfig(config, i) {
    return getOverridableConfig(config.layers, i);
}

function computeBoxHeight(layerConfig) {
    const rows = layerConfig.rows;
    const textsCount = rows.texts.length;
    return rows.padding.top + rows.padding.bottom + (textsCount - 1) * rows.padding.textSpacing + textsCount * rows.textSize;
}

function computeHeight(config, depth) {
    let height = config.margin.top + config.margin.bottom; // Page margins
    for(let i = 0; i < depth; i++) {
        const layer = getLayerConfig(config, i);
        const rows = layer.rows;
        if(i < depth - 1) {
            height += rows.margin.verticalSpacing; // Box margins
        }
        if(rows.orientation === ORIENTATION_HORIZONTAL) {
            // Box padding & text
            height += computeBoxHeight(layer);
        } else {
            // TODO
            throw 'Not implemented';
        }
    }
    return height;
}

export function drawRectangle(inputData, inputConfig = {}) {
    const data = Joi.attempt(inputData, dataSchema);
    const config = Joi.attempt(inputConfig, configSchema);

    const depth = Math.min(computeDepth(data), config.generations);

    const width = config.width;
    const height = computeHeight(config, depth);
    const svg = createSVG({
        viewBox: `0 0 ${width} ${height}`,
        ...config.style,
    });

    let individualIds = [data.rootIndividualId];
    for(let i = 0; i < depth; i++) {
        const layerConfig = getLayerConfig(config, i);

        const rectangleHeight = computeBoxHeight(layerConfig);
        const rectangleY = height - config.margin.bottom - i * (rectangleHeight + layerConfig.rows.margin.verticalSpacing) - rectangleHeight;

        const totalExpectedIndividuals = 1 << i;
        const parentIndividualIds = [];

        const rectangleWidth = (width - 2 * config.margin.sides - (totalExpectedIndividuals - 1) * layerConfig.rows.margin.horizontalSpacing) / totalExpectedIndividuals;

        for(let j = 0; j < totalExpectedIndividuals; j++) {
            const individualId = individualIds[j];
            if(individualId != null) {
                const individual = data.individuals[individualId];
                if(individual != null) {
                    const parents = individual.parents;
                    parentIndividualIds.push(parents.husbandIndividualId, parents.wifeIndividualId);
                }

                const rectangleX = config.margin.sides + j * (layerConfig.rows.margin.horizontalSpacing + rectangleWidth);

                const rect = createElement('rect', {
                    x: rectangleX,
                    y: rectangleY,
                    width: rectangleWidth,
                    height: rectangleHeight,
                    fill: 'none',
                    stroke: 'black',
                    strokeWidth: 1,
                });

                const apiData = {
                    surname: individual.surname,
                    given_name: individual.givenName,
                }

                const texts = layerConfig.rows.texts;
                for(let k = 0; k < texts.length; k++) {
                    const textData = texts[k];
                    const text = createElement('text', {
                        x: rectangleX + rectangleWidth / 2,
                        y: rectangleY + layerConfig.rows.padding.top + k * (layerConfig.rows.padding.textSpacing + layerConfig.rows.textSize) + layerConfig.rows.textSize / 2,
                        'dominant-baseline': 'middle',
                        'text-anchor': 'middle',
                        'font-size': 16,
                        /*'inline-size': rectangleWidth,
                        style: 'text-overflow: clip',*/
                    });
                    text.textContent = apiData[textData.value]; // TODO function

                    //adaptTextSize(text, 16, rectangleWidth);

                    svg.append(text); // TODO reorder elements
                }

                svg.append(rect);
            }
        }

        individualIds = parentIndividualIds;
    }


    return svg;
}
