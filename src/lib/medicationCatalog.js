// Catálogo de medicamentos para a calculadora de enfermagem.
// Cada entrada traz nome, classe terapêutica e a concentração de uma apresentação comum (ver `presentation`).
// É só sugestão didática: o aluno deve conferir o rótulo da ampola ou frasco em uso.

export const DRUGS_COM_BASE = "https://www.drugs.com/search.php?searchterm=";

export function drugUrl(name) {
  return DRUGS_COM_BASE + encodeURIComponent(name);
}

export const MEDICATION_CATALOG = [
  // Analgésicos e Antitérmicos
  { name: "Dipirona (Metamizol)", class: "Analgésico/Antitérmico", concentration: 500, unit: "mg/mL" },
  { name: "Paracetamol", class: "Analgésico/Antitérmico", concentration: 10, unit: "mg/mL", presentation: "Solução injetável 1 g / 100 mL" },
  { name: "Ibuprofeno", class: "AINE", concentration: 50, unit: "mg/mL" },
  { name: "Cetoprofeno", class: "AINE", concentration: 50, unit: "mg/mL", presentation: "Ampola IM 100 mg / 2 mL" },
  { name: "Diclofenaco", class: "AINE", concentration: 25, unit: "mg/mL", presentation: "Ampola 75 mg / 3 mL" },
  { name: "Nimesulida", class: "AINE", concentration: 50, unit: "mg/mL", presentation: "Gotas orais 50 mg/mL" },
  { name: "Tenoxicam", class: "AINE", concentration: 10, unit: "mg/mL", presentation: "Frasco 20 mg reconstituído em 2 mL" },
  { name: "Morfina", class: "Opioide", concentration: 10, unit: "mg/mL" },
  { name: "Tramadol", class: "Opioide", concentration: 50, unit: "mg/mL" },
  { name: "Codeína", class: "Opioide", concentration: 3, unit: "mg/mL", presentation: "Solução oral 3 mg/mL" },
  { name: "Fentanil", class: "Opioide", concentration: 0.05, unit: "mg/mL" },
  { name: "Petidina (Meperidina)", class: "Opioide", concentration: 50, unit: "mg/mL" },

  // Antibióticos
  { name: "Penicilina G Benzatina", class: "Antibiótico", concentration: 300000, unit: "UI/mL", presentation: "1.200.000 UI / 4 mL" },
  { name: "Penicilina G Potássica", class: "Antibiótico", concentration: 500000, unit: "UI/mL", presentation: "5.000.000 UI / 10 mL" },
  { name: "Amoxicilina", class: "Antibiótico", concentration: 50, unit: "mg/mL" },
  { name: "Ceftriaxona", class: "Antibiótico (Cefalosporina 3ª)", concentration: 100, unit: "mg/mL", presentation: "Frasco 1 g reconstituído em 10 mL (IV)" },
  { name: "Gentamicina", class: "Antibiótico (Aminoglicosídeo)", concentration: 40, unit: "mg/mL", presentation: "Ampola 80 mg / 2 mL" },
  { name: "Vancomicina", class: "Antibiótico (Glicopeptídeo)", concentration: 50, unit: "mg/mL", presentation: "Frasco 500 mg reconstituído em 10 mL" },
  { name: "Metronidazol", class: "Antibiótico", concentration: 5, unit: "mg/mL" },
  { name: "Ciprofloxacino", class: "Antibiótico (Fluorquinolona)", concentration: 2, unit: "mg/mL" },

  // Cardiovasculares
  { name: "Furosemida", class: "Diurético de alça", concentration: 10, unit: "mg/mL" },
  { name: "Amiodarona", class: "Antiarrítmico", concentration: 50, unit: "mg/mL" },
  { name: "Nitroglicerina", class: "Vasodilatador", concentration: 5, unit: "mg/mL" },
  { name: "Dopamina", class: "Vasoativo", concentration: 5, unit: "mg/mL" },
  { name: "Noradrenalina (Norepinefrina)", class: "Vasoativo", concentration: 1, unit: "mg/mL" },
  { name: "Adrenalina (Epinefrina)", class: "Vasoativo", concentration: 1, unit: "mg/mL" },
  { name: "Dobutamina", class: "Inotrópico", concentration: 12.5, unit: "mg/mL" },
  { name: "Milrinona", class: "Inotrópico/Inibidor de FDE", concentration: 1, unit: "mg/mL" },

  // Anticoagulantes
  { name: "Heparina Sódica", class: "Anticoagulante", concentration: 5000, unit: "UI/mL" },
  { name: "Enoxaparina", class: "Anticoagulante (HBPM)", concentration: 100, unit: "mg/mL" },

  // Antidiabéticos
  { name: "Insulina NPH", class: "Antidiabético", concentration: 100, unit: "UI/mL" },
  { name: "Insulina Regular", class: "Antidiabético", concentration: 100, unit: "UI/mL" },

  // Eletrólitos e Fluidos
  { name: "Cloreto de Potássio (KCl) 10%", class: "Eletrólito", concentration: 100, unit: "mg/mL", meqPerMl: 1.34 },
  { name: "Cloreto de Potássio (KCl) 19,1%", class: "Eletrólito", concentration: 191, unit: "mg/mL", meqPerMl: 2.56 },
  { name: "Sulfato de Magnésio 10%", class: "Eletrólito", concentration: 100, unit: "mg/mL" },
  { name: "Gluconato de Cálcio 10%", class: "Eletrólito", concentration: 100, unit: "mg/mL" },
  { name: "Glicose 50%", class: "Solução hipertônica", concentration: 500, unit: "mg/mL" },
  { name: "Cloreto de Cálcio 10%", class: "Eletrólito", concentration: 100, unit: "mg/mL" }
];
