// Falas de abertura da consulta (2 variações por personalidade). Os textos vêm de src/data/falas/consulta-abertura-*.json,
// os mesmos que o pipeline do VoiceBox transforma em mp3.
import marcus from "../../../data/falas/consulta-abertura-marcus.json";
import teresinha from "../../../data/falas/consulta-abertura-teresinha.json";
import { escolherAbertura } from "./escolherAbertura.js";

const POR_PERSONAGEM = { marcus, teresinha };

export const abertura = (personagemId, personalidadePublica, semente) => escolherAbertura(personagemId, personalidadePublica, semente, POR_PERSONAGEM);
