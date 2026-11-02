const { LabTestTemplate, Service } = require('../../models');
const defaultLabTemplates = require('./labTemplatesData');
const { SERVICE_CATEGORIES } = require('../../config/constants');

const additionalLabServices = [
  {
    service_code: 'LAB-HIV-01',
    service_name: 'HIV 1/2 Antibody Rapid Screening Test',
    category: SERVICE_CATEGORIES.LABORATORY,
    description: 'Rapid diagnostic screening test for antibodies to HIV-1 and HIV-2',
    price: 150.00,
    is_active: true
  },
  {
    service_code: 'LAB-HBS-01',
    service_name: 'Hepatitis B Surface Antigen (HBsAg)',
    category: SERVICE_CATEGORIES.LABORATORY,
    description: 'Rapid chromatographic immunoassay for qualitative detection of HBsAg',
    price: 200.00,
    is_active: true
  },
  {
    service_code: 'LAB-HCV-01',
    service_name: 'Hepatitis C Antibody (Anti-HCV)',
    category: SERVICE_CATEGORIES.LABORATORY,
    description: 'Immunoassay test for qualitative detection of antibodies to Hepatitis C virus',
    price: 200.00,
    is_active: true
  },
  {
    service_code: 'LAB-PREG-01',
    service_name: 'Pregnancy Test (hCG Urine / Serum)',
    category: SERVICE_CATEGORIES.LABORATORY,
    description: 'Qualitative determination of human chorionic gonadotropin for early pregnancy',
    price: 100.00,
    is_active: true
  },
  {
    service_code: 'LAB-BLDGRP-01',
    service_name: 'Blood Grouping (ABO) & Rh Factor Typing',
    category: SERVICE_CATEGORIES.LABORATORY,
    description: 'Forward ABO blood grouping and Rhesus (Rh-D) antigen determination',
    price: 150.00,
    is_active: true
  },
  {
    service_code: 'LAB-HB-01',
    service_name: 'Hemoglobin (Hb Concentration Only)',
    category: SERVICE_CATEGORIES.LABORATORY,
    description: 'Photometric measurement of blood hemoglobin level for anemia screening',
    price: 100.00,
    is_active: true
  },
  {
    service_code: 'LAB-RFT-01',
    service_name: 'Renal Function Tests (Serum Creatinine & BUN)',
    category: SERVICE_CATEGORIES.LABORATORY,
    description: 'Serum Creatinine, Blood Urea Nitrogen, and glomerular filtration assessment',
    price: 350.00,
    is_active: true
  }
];

const seedLabTemplates = async () => {
  try {
    // 1. Check and seed additional lab services if missing
    for (const srv of additionalLabServices) {
      const existing = await Service.findOne({ where: { service_code: srv.service_code } });
      if (!existing) {
        await Service.create(srv);
        console.log(`Added missing lab service: ${srv.service_name} (${srv.service_code})`);
      }
    }

    // 2. Check and seed lab test templates
    for (const tmpl of defaultLabTemplates) {
      const existing = await LabTestTemplate.findOne({ where: { template_code: tmpl.template_code } });
      if (!existing) {
        await LabTestTemplate.create(tmpl);
        console.log(`Seeded laboratory template: ${tmpl.template_name} (${tmpl.template_code})`);
      }
    }

    console.log('Laboratory test templates verification complete.');
  } catch (error) {
    console.error('Error seeding laboratory templates:', error.message);
  }
};

module.exports = seedLabTemplates;
