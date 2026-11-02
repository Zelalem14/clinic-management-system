const defaultLabTemplates = [
  {
    template_code: 'TMPL-HIV',
    template_name: 'HIV 1/2 Antibody Rapid Screening Test',
    category: 'serology',
    specimen_type: 'Capillary Whole Blood / Serum / Plasma',
    department: 'Serology & Infectious Diseases',
    default_observations: 'Assayed with rapid immunochromatographic assay. Standard 3-test national algorithm applicable.',
    parameters: [
      {
        id: 'hiv_result',
        name: 'HIV-1/2 Antibody Rapid Result',
        type: 'options',
        options: ['Negative (Non-Reactive)', 'Positive (Reactive)', 'Invalid / Retest Required'],
        default_value: 'Negative (Non-Reactive)',
        abnormal_options: ['Positive (Reactive)', 'Invalid / Retest Required']
      },
      {
        id: 'test_kit',
        name: 'Screening Assay Brand / Method',
        type: 'options',
        options: ['Alere Determine HIV-1/2 (Test 1)', 'Chembio HIV 1/2 Stat-Pak (Confirmatory)', 'Uni-Gold HIV (Tie-breaker)', 'SD Bioline HIV-1/2 3.0'],
        default_value: 'Alere Determine HIV-1/2 (Test 1)'
      },
      {
        id: 'internal_control',
        name: 'Internal Kit Quality Control',
        type: 'options',
        options: ['Valid (Control Band Present)', 'Invalid (Control Band Absent)'],
        default_value: 'Valid (Control Band Present)'
      }
    ]
  },
  {
    template_code: 'TMPL-HBSAG',
    template_name: 'Hepatitis B Surface Antigen (HBsAg)',
    category: 'serology',
    specimen_type: 'Venous Serum / Plasma',
    department: 'Serology & Infectious Diseases',
    default_observations: 'Qualitative immunochromatographic detection of Hepatitis B Surface Antigen (HBsAg).',
    parameters: [
      {
        id: 'hbsag_result',
        name: 'HBsAg Result',
        type: 'options',
        options: ['Negative (Non-Reactive)', 'Positive (Reactive)', 'Invalid / Retest Required'],
        default_value: 'Negative (Non-Reactive)',
        abnormal_options: ['Positive (Reactive)', 'Invalid / Retest Required']
      },
      {
        id: 'method',
        name: 'Test Methodology',
        type: 'options',
        options: ['Rapid Membrane Immunoassay (RDT)', 'Chemiluminescence (CLIA)', 'ELISA (Microplate)'],
        default_value: 'Rapid Membrane Immunoassay (RDT)'
      },
      {
        id: 'internal_control',
        name: 'Quality Control Line',
        type: 'options',
        options: ['Valid', 'Invalid'],
        default_value: 'Valid'
      }
    ]
  },
  {
    template_code: 'TMPL-HCV',
    template_name: 'Hepatitis C Antibody (Anti-HCV)',
    category: 'serology',
    specimen_type: 'Venous Serum / Plasma',
    department: 'Serology & Infectious Diseases',
    default_observations: 'Qualitative antibody detection for Hepatitis C Virus (HCV).',
    parameters: [
      {
        id: 'hcv_result',
        name: 'Anti-HCV Antibody Result',
        type: 'options',
        options: ['Negative (Non-Reactive)', 'Positive (Reactive)', 'Invalid / Retest Required'],
        default_value: 'Negative (Non-Reactive)',
        abnormal_options: ['Positive (Reactive)', 'Invalid / Retest Required']
      },
      {
        id: 'method',
        name: 'Test Methodology',
        type: 'options',
        options: ['Rapid Lateral Flow Immunoassay', 'ELISA (3rd Gen)', 'CLIA'],
        default_value: 'Rapid Lateral Flow Immunoassay'
      },
      {
        id: 'internal_control',
        name: 'Quality Control Line',
        type: 'options',
        options: ['Valid', 'Invalid'],
        default_value: 'Valid'
      }
    ]
  },
  {
    template_code: 'TMPL-MALARIA',
    template_name: 'Malaria Rapid Diagnostic Test (RDT) & Blood Film',
    category: 'parasitology',
    specimen_type: 'Capillary Blood / Venous Whole Blood (EDTA)',
    department: 'Parasitology',
    default_observations: 'Examined under oil immersion (100x). Antigen RDT confirmed.',
    parameters: [
      {
        id: 'malaria_rdt',
        name: 'Malaria Antigen RDT Result',
        type: 'options',
        options: [
          'Negative (No Plasmodium antigens detected)',
          'Positive for Plasmodium falciparum (Pf HRP-2)',
          'Positive for Plasmodium vivax (Pv-LDH)',
          'Positive for Mixed Infection (Pf + Pv)',
          'Invalid Test (Retest with new cassette)'
        ],
        default_value: 'Negative (No Plasmodium antigens detected)',
        abnormal_options: [
          'Positive for Plasmodium falciparum (Pf HRP-2)',
          'Positive for Plasmodium vivax (Pv-LDH)',
          'Positive for Mixed Infection (Pf + Pv)',
          'Invalid Test (Retest with new cassette)'
        ]
      },
      {
        id: 'blood_film',
        name: 'Giemsa Microscopy Blood Film',
        type: 'options',
        options: [
          'Negative (No hemoparasites seen in 100 fields)',
          'Trophozoites (Rings) seen',
          'Gametocytes seen',
          'Schizonts seen'
        ],
        default_value: 'Negative (No hemoparasites seen in 100 fields)',
        abnormal_options: [
          'Trophozoites (Rings) seen',
          'Gametocytes seen',
          'Schizonts seen'
        ]
      },
      {
        id: 'parasite_density',
        name: 'Parasitemia / Density',
        type: 'options',
        options: [
          'None (0 / uL)',
          'Rare / Low (+1: 1-10 parasites per 100 thick fields)',
          'Moderate (+2: 11-100 parasites per 100 thick fields)',
          'High (+3: 1-10 parasites per single thick field)',
          'Very High (+4: >10 parasites per single thick field)'
        ],
        default_value: 'None (0 / uL)'
      }
    ]
  },
  {
    template_code: 'TMPL-PREG',
    template_name: 'Pregnancy Test (hCG Urine / Serum)',
    category: 'serology',
    specimen_type: 'Early Morning Urine / Serum',
    department: 'Clinical Chemistry & Serology',
    default_observations: 'Qualitative detection of Human Chorionic Gonadotropin (hCG) with analytical sensitivity of 25 mIU/mL.',
    parameters: [
      {
        id: 'hcg_result',
        name: 'hCG Pregnancy Result',
        type: 'options',
        options: ['Negative', 'Positive', 'Invalid / Retest Required'],
        default_value: 'Negative',
        abnormal_options: ['Positive', 'Invalid / Retest Required']
      },
      {
        id: 'specimen_used',
        name: 'Specimen Used',
        type: 'options',
        options: ['Urine (Early Morning Specimen)', 'Serum (Venous)', 'Plasma'],
        default_value: 'Urine (Early Morning Specimen)'
      },
      {
        id: 'control_indicator',
        name: 'Control Band',
        type: 'options',
        options: ['Confirmed Valid', 'Invalid'],
        default_value: 'Confirmed Valid'
      }
    ]
  },
  {
    template_code: 'TMPL-BLOODGROUP',
    template_name: 'Blood Grouping (ABO) & Rhesus (Rh) Typing',
    category: 'hematology',
    specimen_type: 'Whole Blood (EDTA)',
    department: 'Immunohematology / Blood Transfusion',
    default_observations: 'Tube/Slide agglutination method with monoclonal Anti-A, Anti-B, and Anti-D (IgM/IgG).',
    parameters: [
      {
        id: 'blood_group_rh',
        name: 'Blood Group & Rh Summary',
        type: 'options',
        options: ['O Positive (O+)', 'O Negative (O-)', 'A Positive (A+)', 'A Negative (A-)', 'B Positive (B+)', 'B Negative (B-)', 'AB Positive (AB+)', 'AB Negative (AB-)'],
        default_value: 'O Positive (O+)'
      },
      {
        id: 'abo_group',
        name: 'ABO Group',
        type: 'options',
        options: ['Group O', 'Group A', 'Group B', 'Group AB'],
        default_value: 'Group O'
      },
      {
        id: 'rh_factor',
        name: 'Rhesus (Rh-D) Factor',
        type: 'options',
        options: ['Rh (D) Positive', 'Rh (D) Negative'],
        default_value: 'Rh (D) Positive'
      },
      {
        id: 'anti_a_reaction',
        name: 'Anti-A Agglutination',
        type: 'options',
        options: ['Negative (No agglutination)', 'Positive (+4 agglutination)'],
        default_value: 'Negative (No agglutination)'
      },
      {
        id: 'anti_b_reaction',
        name: 'Anti-B Agglutination',
        type: 'options',
        options: ['Negative (No agglutination)', 'Positive (+4 agglutination)'],
        default_value: 'Negative (No agglutination)'
      },
      {
        id: 'anti_d_reaction',
        name: 'Anti-D (Rh) Agglutination',
        type: 'options',
        options: ['Positive (+4 agglutination)', 'Negative (No agglutination)'],
        default_value: 'Positive (+4 agglutination)'
      }
    ]
  },
  {
    template_code: 'TMPL-GLUCOSE',
    template_name: 'Blood Sugar / Glucose Evaluation',
    category: 'biochemistry',
    specimen_type: 'Fluoride Oxalate Plasma / Serum',
    department: 'Clinical Chemistry',
    default_observations: 'Glucose oxidase (GOD-POD) enzymatic method. Fasting verified.',
    parameters: [
      {
        id: 'glucose_type',
        name: 'Test Timing / Type',
        type: 'options',
        options: ['Fasting Blood Sugar (FBS - 8-12 hr fast)', 'Random Blood Sugar (RBS)', '2-Hour Postprandial (2H-PP)', 'Oral Glucose Tolerance (OGTT)'],
        default_value: 'Fasting Blood Sugar (FBS - 8-12 hr fast)'
      },
      {
        id: 'glucose_value',
        name: 'Glucose Concentration',
        type: 'numeric',
        unit: 'mg/dL',
        ref_min: 70,
        ref_max: 100,
        ref_range_text: '70 - 100 mg/dL (Normal Fasting) | < 140 mg/dL (Random)',
        critical_low: 50,
        critical_high: 350
      }
    ]
  },
  {
    template_code: 'TMPL-HB',
    template_name: 'Hemoglobin (Hb) Concentration Only',
    category: 'hematology',
    specimen_type: 'Whole Blood (EDTA)',
    department: 'Hematology',
    default_observations: 'Cyanmethemoglobin spectrophotometric / Automated photometer.',
    parameters: [
      {
        id: 'hemoglobin_val',
        name: 'Hemoglobin (Hb)',
        type: 'numeric',
        unit: 'g/dL',
        ref_min: 12.0,
        ref_max: 17.5,
        male_min: 13.8,
        male_max: 17.2,
        female_min: 12.1,
        female_max: 15.1,
        pediatric_min: 11.0,
        pediatric_max: 16.0,
        ref_range_text: 'Male: 13.8 - 17.2 | Female: 12.1 - 15.1 | Child: 11.0 - 16.0 g/dL',
        critical_low: 7.0,
        critical_high: 20.0
      }
    ]
  },
  {
    template_code: 'TMPL-CBC',
    template_name: 'Complete Blood Count (CBC / FBC with 5-Part Diff)',
    category: 'hematology',
    specimen_type: 'Whole Blood (K2/K3-EDTA)',
    department: 'Hematology',
    default_observations: 'Automated 5-part differential laser flow cytometry and impedance counter.',
    parameters: [
      {
        id: 'wbc',
        name: 'White Blood Cell Count (WBC)',
        type: 'numeric',
        unit: '10^3/uL',
        ref_min: 4.0,
        ref_max: 10.0,
        ref_range_text: '4.0 - 10.0 x10^3/uL',
        critical_low: 2.0,
        critical_high: 30.0
      },
      {
        id: 'rbc',
        name: 'Red Blood Cell Count (RBC)',
        type: 'numeric',
        unit: '10^6/uL',
        ref_min: 4.2,
        ref_max: 5.8,
        male_min: 4.5,
        male_max: 5.9,
        female_min: 4.1,
        female_max: 5.1,
        ref_range_text: 'Male: 4.5 - 5.9 | Female: 4.1 - 5.1 x10^6/uL'
      },
      {
        id: 'hgb',
        name: 'Hemoglobin (HGB)',
        type: 'numeric',
        unit: 'g/dL',
        ref_min: 12.0,
        ref_max: 17.2,
        male_min: 13.8,
        male_max: 17.2,
        female_min: 12.1,
        female_max: 15.1,
        ref_range_text: 'Male: 13.8 - 17.2 | Female: 12.1 - 15.1 g/dL',
        critical_low: 7.0,
        critical_high: 20.0
      },
      {
        id: 'hct',
        name: 'Hematocrit (HCT / Packed Cell Volume)',
        type: 'numeric',
        unit: '%',
        ref_min: 36.0,
        ref_max: 50.0,
        male_min: 40.0,
        male_max: 50.0,
        female_min: 36.0,
        female_max: 46.0,
        ref_range_text: 'Male: 40.0 - 50.0% | Female: 36.0 - 46.0%'
      },
      {
        id: 'mcv',
        name: 'Mean Corpuscular Volume (MCV)',
        type: 'numeric',
        unit: 'fL',
        ref_min: 80.0,
        ref_max: 98.0,
        ref_range_text: '80.0 - 98.0 fL'
      },
      {
        id: 'mch',
        name: 'Mean Corpuscular Hemoglobin (MCH)',
        type: 'numeric',
        unit: 'pg',
        ref_min: 27.0,
        ref_max: 33.0,
        ref_range_text: '27.0 - 33.0 pg'
      },
      {
        id: 'mchc',
        name: 'Mean Corpuscular Hb Concentration (MCHC)',
        type: 'numeric',
        unit: 'g/dL',
        ref_min: 32.0,
        ref_max: 36.0,
        ref_range_text: '32.0 - 36.0 g/dL'
      },
      {
        id: 'plt',
        name: 'Platelet Count (PLT)',
        type: 'numeric',
        unit: '10^3/uL',
        ref_min: 150,
        ref_max: 450,
        ref_range_text: '150 - 450 x10^3/uL',
        critical_low: 50,
        critical_high: 1000
      },
      {
        id: 'neut_pct',
        name: 'Neutrophils %',
        type: 'numeric',
        unit: '%',
        ref_min: 45.0,
        ref_max: 70.0,
        ref_range_text: '45.0 - 70.0%'
      },
      {
        id: 'lymph_pct',
        name: 'Lymphocytes %',
        type: 'numeric',
        unit: '%',
        ref_min: 20.0,
        ref_max: 45.0,
        ref_range_text: '20.0 - 45.0%'
      },
      {
        id: 'mono_pct',
        name: 'Monocytes %',
        type: 'numeric',
        unit: '%',
        ref_min: 2.0,
        ref_max: 8.0,
        ref_range_text: '2.0 - 8.0%'
      },
      {
        id: 'eos_pct',
        name: 'Eosinophils %',
        type: 'numeric',
        unit: '%',
        ref_min: 1.0,
        ref_max: 6.0,
        ref_range_text: '1.0 - 6.0%'
      },
      {
        id: 'baso_pct',
        name: 'Basophils %',
        type: 'numeric',
        unit: '%',
        ref_min: 0.0,
        ref_max: 1.0,
        ref_range_text: '0.0 - 1.0%'
      }
    ]
  },
  {
    template_code: 'TMPL-URINE',
    template_name: 'Routine Urinalysis (Chemical & Microscopic)',
    category: 'urinalysis',
    specimen_type: 'Clean-catch Midstream Urine',
    department: 'Urinalysis & Clinical Microscopy',
    default_observations: 'Centrifuged at 2000 RPM for 5 min. Supernatant decanted; sediment examined.',
    parameters: [
      {
        id: 'color',
        name: 'Macroscopic Color',
        type: 'options',
        options: ['Pale Yellow', 'Yellow', 'Dark Amber', 'Orange', 'Red / Hematuric', 'Tea Colored'],
        default_value: 'Yellow'
      },
      {
        id: 'appearance',
        name: 'Clarity / Appearance',
        type: 'options',
        options: ['Clear', 'Slightly Hazy', 'Hazy', 'Turbid / Cloudy'],
        default_value: 'Clear'
      },
      {
        id: 'ph',
        name: 'Reaction (pH)',
        type: 'options',
        options: ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'],
        default_value: '6.0',
        ref_range_text: '5.0 - 7.5'
      },
      {
        id: 'specific_gravity',
        name: 'Specific Gravity (S.G)',
        type: 'options',
        options: ['1.005', '1.010', '1.015', '1.020', '1.025', '1.030'],
        default_value: '1.015',
        ref_range_text: '1.005 - 1.030'
      },
      {
        id: 'protein',
        name: 'Protein (Albumin)',
        type: 'options',
        options: ['Negative', 'Trace', '+1 (30 mg/dL)', '+2 (100 mg/dL)', '+3 (300 mg/dL)', '+4 (>1000 mg/dL)'],
        default_value: 'Negative',
        abnormal_options: ['+1 (30 mg/dL)', '+2 (100 mg/dL)', '+3 (300 mg/dL)', '+4 (>1000 mg/dL)']
      },
      {
        id: 'glucose',
        name: 'Glucose (Sugar)',
        type: 'options',
        options: ['Negative', 'Normal', '+1 (100 mg/dL)', '+2 (250 mg/dL)', '+3 (500 mg/dL)', '+4 (>=1000 mg/dL)'],
        default_value: 'Negative',
        abnormal_options: ['+1 (100 mg/dL)', '+2 (250 mg/dL)', '+3 (500 mg/dL)', '+4 (>=1000 mg/dL)']
      },
      {
        id: 'ketones',
        name: 'Ketone Bodies',
        type: 'options',
        options: ['Negative', 'Trace', '+1 (Small)', '+2 (Moderate)', '+3 (Large)'],
        default_value: 'Negative',
        abnormal_options: ['+1 (Small)', '+2 (Moderate)', '+3 (Large)']
      },
      {
        id: 'blood',
        name: 'Occult Blood / Hemoglobin',
        type: 'options',
        options: ['Negative', 'Trace', '+1 (Small)', '+2 (Moderate)', '+3 (Large)'],
        default_value: 'Negative',
        abnormal_options: ['+1 (Small)', '+2 (Moderate)', '+3 (Large)']
      },
      {
        id: 'bilirubin',
        name: 'Bilirubin',
        type: 'options',
        options: ['Negative', '+1', '+2', '+3'],
        default_value: 'Negative',
        abnormal_options: ['+1', '+2', '+3']
      },
      {
        id: 'urobilinogen',
        name: 'Urobilinogen',
        type: 'options',
        options: ['Normal (0.2 mg/dL)', 'Increased (+1)', 'Increased (+2)'],
        default_value: 'Normal (0.2 mg/dL)',
        abnormal_options: ['Increased (+1)', 'Increased (+2)']
      },
      {
        id: 'nitrite',
        name: 'Nitrite',
        type: 'options',
        options: ['Negative', 'Positive'],
        default_value: 'Negative',
        abnormal_options: ['Positive']
      },
      {
        id: 'leukocytes',
        name: 'Leukocyte Esterase',
        type: 'options',
        options: ['Negative', 'Trace', '+1 (Small)', '+2 (Moderate)', '+3 (Large)'],
        default_value: 'Negative',
        abnormal_options: ['+1 (Small)', '+2 (Moderate)', '+3 (Large)']
      },
      {
        id: 'pus_cells_micro',
        name: 'Microscopic Pus Cells (WBC)',
        type: 'options',
        options: ['0 - 2 /HPF', '2 - 5 /HPF', '5 - 10 /HPF', '10 - 20 /HPF', '20 - 50 /HPF', '> 50 /HPF (Pyuria)'],
        default_value: '0 - 2 /HPF',
        ref_range_text: '0 - 5 /HPF',
        abnormal_options: ['10 - 20 /HPF', '20 - 50 /HPF', '> 50 /HPF (Pyuria)']
      },
      {
        id: 'rbc_micro',
        name: 'Microscopic Red Blood Cells (RBC)',
        type: 'options',
        options: ['0 - 2 /HPF', '2 - 5 /HPF', '5 - 10 /HPF', '10 - 25 /HPF', '> 25 /HPF (Hematuria)'],
        default_value: '0 - 2 /HPF',
        ref_range_text: '0 - 2 /HPF',
        abnormal_options: ['5 - 10 /HPF', '10 - 25 /HPF', '> 25 /HPF (Hematuria)']
      },
      {
        id: 'epithelial_cells',
        name: 'Epithelial Cells',
        type: 'options',
        options: ['Few / Occasional', 'Moderate', 'Many'],
        default_value: 'Few / Occasional',
        ref_range_text: 'Few'
      },
      {
        id: 'bacteria',
        name: 'Bacteria',
        type: 'options',
        options: ['None seen', 'Few (+1)', 'Moderate (+2)', 'Abundant (+3)'],
        default_value: 'None seen',
        ref_range_text: 'None seen',
        abnormal_options: ['Moderate (+2)', 'Abundant (+3)']
      },
      {
        id: 'casts',
        name: 'Casts',
        type: 'options',
        options: ['None seen', 'Hyaline Casts (0-1 /LPF)', 'Granular Casts (Abnormal)', 'WBC Casts (Abnormal)', 'RBC Casts (Abnormal)'],
        default_value: 'None seen',
        ref_range_text: 'None seen'
      },
      {
        id: 'crystals',
        name: 'Crystals',
        type: 'options',
        options: ['None seen', 'Calcium Oxalate', 'Uric Acid', 'Triple Phosphate', 'Amorphous Urates'],
        default_value: 'None seen',
        ref_range_text: 'None seen'
      }
    ]
  },
  {
    template_code: 'TMPL-STOOL',
    template_name: 'Stool Routine Examination & Direct Microscopy',
    category: 'parasitology',
    specimen_type: 'Fresh Stool Specimen',
    department: 'Parasitology & Clinical Microscopy',
    default_observations: 'Saline and Lugols Iodine wet mount direct microscopic preparation examined under 10x and 40x objectives.',
    parameters: [
      {
        id: 'consistency',
        name: 'Stool Consistency',
        type: 'options',
        options: ['Formed', 'Semi-formed', 'Soft', 'Watery / Loose', 'Mucoid', 'Bloody-mucoid'],
        default_value: 'Formed'
      },
      {
        id: 'color',
        name: 'Color',
        type: 'options',
        options: ['Brown', 'Yellowish', 'Dark / Black (Melena)', 'Clay-colored', 'Greenish'],
        default_value: 'Brown'
      },
      {
        id: 'parasite_microscopy',
        name: 'Ova, Trophozoites & Cysts (Microscopy)',
        type: 'options',
        options: [
          'No parasites, cysts, or ova seen (Negative)',
          'Entamoeba histolytica / dispar Cysts seen',
          'Entamoeba histolytica Trophozoites (with ingested RBCs)',
          'Giardia lamblia Cysts seen',
          'Giardia lamblia Trophozoites seen',
          'Ascaris lumbricoides Ova seen',
          'Hookworm Ova seen',
          'Hymenolepis nana Ova seen',
          'Trichuris trichiura Ova seen',
          'Strongyloides stercoralis Rhabditiform Larvae seen'
        ],
        default_value: 'No parasites, cysts, or ova seen (Negative)',
        abnormal_options: [
          'Entamoeba histolytica / dispar Cysts seen',
          'Entamoeba histolytica Trophozoites (with ingested RBCs)',
          'Giardia lamblia Cysts seen',
          'Giardia lamblia Trophozoites seen',
          'Ascaris lumbricoides Ova seen',
          'Hookworm Ova seen',
          'Hymenolepis nana Ova seen',
          'Trichuris trichiura Ova seen',
          'Strongyloides stercoralis Rhabditiform Larvae seen'
        ]
      },
      {
        id: 'stool_pus_cells',
        name: 'Pus Cells (WBC)',
        type: 'options',
        options: ['None seen', '0 - 2 /HPF', '2 - 5 /HPF', '5 - 10 /HPF', '10 - 20 /HPF', 'Numerous (Invasive infection)'],
        default_value: 'None seen',
        ref_range_text: '0 - 2 /HPF',
        abnormal_options: ['5 - 10 /HPF', '10 - 20 /HPF', 'Numerous (Invasive infection)']
      },
      {
        id: 'stool_rbc',
        name: 'Red Blood Cells (RBC)',
        type: 'options',
        options: ['None seen', '0 - 2 /HPF', '2 - 5 /HPF', '5 - 10 /HPF', 'Numerous / Hemorrhagic'],
        default_value: 'None seen',
        ref_range_text: 'None seen',
        abnormal_options: ['2 - 5 /HPF', '5 - 10 /HPF', 'Numerous / Hemorrhagic']
      },
      {
        id: 'yeast_cells',
        name: 'Yeast / Fungal Elements',
        type: 'options',
        options: ['None seen', 'Few (+1)', 'Moderate (+2)', 'Abundant (+3)'],
        default_value: 'None seen',
        ref_range_text: 'None seen'
      }
    ]
  },
  {
    template_code: 'TMPL-WIDAL',
    template_name: 'Widal Typhoid Agglutination Test (Slide / Tube)',
    category: 'serology',
    specimen_type: 'Serum',
    department: 'Serology',
    default_observations: 'Assessed with Salmonella enterica somatic (O) and flagellar (H) antigens.',
    parameters: [
      {
        id: 's_typhi_o',
        name: 'Salmonella typhi Somatic "O" Antigen',
        type: 'options',
        options: ['< 1:80 (Negative)', '1:80 (Borderline)', '1:160 (Diagnostic / Positive)', '1:320 (Strong Positive)'],
        default_value: '< 1:80 (Negative)',
        abnormal_options: ['1:160 (Diagnostic / Positive)', '1:320 (Strong Positive)']
      },
      {
        id: 's_typhi_h',
        name: 'Salmonella typhi Flagellar "H" Antigen',
        type: 'options',
        options: ['< 1:80 (Negative)', '1:80 (Borderline)', '1:160 (Diagnostic / Positive)', '1:320 (Strong Positive)'],
        default_value: '< 1:80 (Negative)',
        abnormal_options: ['1:160 (Diagnostic / Positive)', '1:320 (Strong Positive)']
      },
      {
        id: 's_paratyphi_ah',
        name: 'Salmonella paratyphi "AH"',
        type: 'options',
        options: ['< 1:80 (Negative)', '1:80 (Borderline)', '1:160 (Positive)'],
        default_value: '< 1:80 (Negative)',
        abnormal_options: ['1:160 (Positive)']
      },
      {
        id: 's_paratyphi_bh',
        name: 'Salmonella paratyphi "BH"',
        type: 'options',
        options: ['< 1:80 (Negative)', '1:80 (Borderline)', '1:160 (Positive)'],
        default_value: '< 1:80 (Negative)',
        abnormal_options: ['1:160 (Positive)']
      }
    ]
  },
  {
    template_code: 'TMPL-HPYLORI',
    template_name: 'Helicobacter Pylori Antigen (Stool / Serum)',
    category: 'microbiology',
    specimen_type: 'Stool Specimen / Serum',
    department: 'Microbiology & Serology',
    default_observations: 'Rapid chromatographic immunoassay for the qualitative detection of H. Pylori antigen.',
    parameters: [
      {
        id: 'hpylori_result',
        name: 'H. Pylori Result',
        type: 'options',
        options: ['Negative (Non-Reactive)', 'Positive (Reactive)', 'Invalid / Retest'],
        default_value: 'Negative (Non-Reactive)',
        abnormal_options: ['Positive (Reactive)', 'Invalid / Retest']
      },
      {
        id: 'specimen_source',
        name: 'Specimen Source',
        type: 'options',
        options: ['Stool Antigen (Recommended)', 'Serum Antibody'],
        default_value: 'Stool Antigen (Recommended)'
      }
    ]
  },
  {
    template_code: 'TMPL-LIPID',
    template_name: 'Lipid Profile Panel (Complete)',
    category: 'biochemistry',
    specimen_type: 'Fasting Serum (12-14 hr fast)',
    department: 'Clinical Chemistry',
    default_observations: 'Enzymatic colorimetric endpoint assay. Fasting verified.',
    parameters: [
      {
        id: 'total_cholesterol',
        name: 'Total Cholesterol',
        type: 'numeric',
        unit: 'mg/dL',
        ref_min: 0,
        ref_max: 200,
        ref_range_text: '< 200 mg/dL (Desirable) | 200-239 (Borderline) | >= 240 (High)'
      },
      {
        id: 'triglycerides',
        name: 'Triglycerides',
        type: 'numeric',
        unit: 'mg/dL',
        ref_min: 0,
        ref_max: 150,
        ref_range_text: '< 150 mg/dL (Normal) | 150-199 (Borderline) | >= 200 (High)'
      },
      {
        id: 'hdl_cholesterol',
        name: 'HDL Cholesterol (Good)',
        type: 'numeric',
        unit: 'mg/dL',
        ref_min: 40,
        ref_max: 100,
        male_min: 40,
        female_min: 50,
        ref_range_text: 'Male: > 40 mg/dL | Female: > 50 mg/dL (Optimal > 60)'
      },
      {
        id: 'ldl_cholesterol',
        name: 'LDL Cholesterol (Calculated/Direct)',
        type: 'numeric',
        unit: 'mg/dL',
        ref_min: 0,
        ref_max: 100,
        ref_range_text: '< 100 mg/dL (Optimal) | 100-129 (Near optimal) | >= 160 (High)'
      }
    ]
  },
  {
    template_code: 'TMPL-LFT',
    template_name: 'Liver Function Test Panel (LFT)',
    category: 'biochemistry',
    specimen_type: 'Serum',
    department: 'Clinical Chemistry',
    default_observations: 'Assayed with automated dry/wet chemistry analyzer at 37°C.',
    parameters: [
      {
        id: 'alt',
        name: 'ALT (SGPT)',
        type: 'numeric',
        unit: 'U/L',
        ref_min: 7,
        ref_max: 56,
        ref_range_text: '7 - 56 U/L'
      },
      {
        id: 'ast',
        name: 'AST (SGOT)',
        type: 'numeric',
        unit: 'U/L',
        ref_min: 10,
        ref_max: 40,
        ref_range_text: '10 - 40 U/L'
      },
      {
        id: 'alp',
        name: 'Alkaline Phosphatase (ALP)',
        type: 'numeric',
        unit: 'U/L',
        ref_min: 44,
        ref_max: 147,
        ref_range_text: '44 - 147 U/L'
      },
      {
        id: 'total_bili',
        name: 'Total Bilirubin',
        type: 'numeric',
        unit: 'mg/dL',
        ref_min: 0.2,
        ref_max: 1.2,
        ref_range_text: '0.2 - 1.2 mg/dL'
      },
      {
        id: 'direct_bili',
        name: 'Direct (Conjugated) Bilirubin',
        type: 'numeric',
        unit: 'mg/dL',
        ref_min: 0.0,
        ref_max: 0.3,
        ref_range_text: '0.0 - 0.3 mg/dL'
      },
      {
        id: 'total_protein',
        name: 'Total Protein',
        type: 'numeric',
        unit: 'g/dL',
        ref_min: 6.0,
        ref_max: 8.3,
        ref_range_text: '6.0 - 8.3 g/dL'
      },
      {
        id: 'albumin',
        name: 'Albumin',
        type: 'numeric',
        unit: 'g/dL',
        ref_min: 3.5,
        ref_max: 5.5,
        ref_range_text: '3.5 - 5.5 g/dL'
      }
    ]
  },
  {
    template_code: 'TMPL-RFT',
    template_name: 'Renal Function Tests (Creatinine & BUN / Urea)',
    category: 'biochemistry',
    specimen_type: 'Serum',
    department: 'Clinical Chemistry',
    default_observations: 'Modified Jaffe reaction / Enzymatic UV method.',
    parameters: [
      {
        id: 'creatinine',
        name: 'Serum Creatinine',
        type: 'numeric',
        unit: 'mg/dL',
        ref_min: 0.6,
        ref_max: 1.3,
        male_min: 0.7,
        male_max: 1.3,
        female_min: 0.6,
        female_max: 1.1,
        ref_range_text: 'Male: 0.7 - 1.3 | Female: 0.6 - 1.1 mg/dL',
        critical_high: 5.0
      },
      {
        id: 'blood_urea',
        name: 'Blood Urea Nitrogen (BUN)',
        type: 'numeric',
        unit: 'mg/dL',
        ref_min: 7,
        ref_max: 20,
        ref_range_text: '7 - 20 mg/dL (BUN) | 15 - 45 mg/dL (Serum Urea)'
      },
      {
        id: 'uric_acid',
        name: 'Uric Acid',
        type: 'numeric',
        unit: 'mg/dL',
        ref_min: 2.5,
        ref_max: 7.2,
        male_min: 3.4,
        male_max: 7.0,
        female_min: 2.4,
        female_max: 6.0,
        ref_range_text: 'Male: 3.4 - 7.0 | Female: 2.4 - 6.0 mg/dL'
      }
    ]
  }
];

module.exports = defaultLabTemplates;
