const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');
const seedDatabase = require('../src/database/seeders/seed');

describe('Clinic Management System API Test Suite', () => {
  let adminToken;
  let receptionistToken;
  let doctorToken;
  let labTechToken;

  beforeAll(async () => {
    // Re-seed fresh test database
    await seedDatabase();

    // Authenticate Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@clinic.com', password: 'Admin@123' });
    adminToken = adminRes.body.token;

    // Authenticate Receptionist
    const receptRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reception@clinic.com', password: 'Recept@123' });
    receptionistToken = receptRes.body.token;

    // Authenticate Doctor
    const doctorRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'doctor@clinic.com', password: 'Doctor@123' });
    doctorToken = doctorRes.body.token;

    // Authenticate Lab Tech
    const labRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'lab@clinic.com', password: 'Lab@123' });
    labTechToken = labRes.body.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('1. Authentication & Role Permissions', () => {
    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'doctor@clinic.com', password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return user info for authenticated session', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('doctor');
      expect(res.body.user.email).toBe('doctor@clinic.com');
    });

    it('should prevent receptionist from creating medical services (Admin only)', async () => {
      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          service_code: 'TEST-SRV',
          service_name: 'Test Service',
          category: 'other',
          price: 50.0
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin to create new services', async () => {
      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          service_code: 'TEST-SRV-99',
          service_name: 'Special Allergy Panel',
          category: 'laboratory',
          price: 65.0
        });

      expect(res.status).toBe(201);
      expect(res.body.service.service_code).toBe('TEST-SRV-99');
    });
  });

  describe('2. Patient Registration and Payment Approval Workflow', () => {
    let createdPatientId;
    let pendingPaymentId;

    it('should register a new patient and calculate registration fees', async () => {
      const res = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          full_name: 'Test Patient Alpha',
          dob: '1990-05-15',
          sex: 'male',
          phone: '+1 (555) 999-1122',
          address: '100 Health Way',
          consultation_type: 'General Consultation',
          payment_method: 'cash',
          approve_payment_now: false
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.patient.card_number).toBeDefined();
      expect(res.body.payment.status).toBe('pending');

      createdPatientId = res.body.patient.id;
      pendingPaymentId = res.body.payment.id;
    });

    it('should prevent duplicate patient registration with same name and phone', async () => {
      const res = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          full_name: 'Test Patient Alpha',
          sex: 'male',
          phone: '+1 (555) 999-1122'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should approve verified payment and route patient to doctor waiting queue', async () => {
      const res = await request(app)
        .post(`/api/payments/${pendingPaymentId}/approve`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          payment_method: 'cash',
          amount_paid: 35.00,
          transaction_reference: 'TEST-REC-001'
        });

      expect(res.status).toBe(200);
      expect(res.body.payment.status).toBe('approved');
      expect(res.body.payment.approved_by).toBeDefined();

      // Verify patient is now in Doctor waiting queue
      const queueRes = await request(app)
        .get('/api/consultations/queue')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(queueRes.status).toBe(200);
      const inQueue = queueRes.body.queue.some(v => v.patient_id === createdPatientId);
      expect(inQueue).toBe(true);
    });

    it('should prevent duplicate approval on already approved payment', async () => {
      const res = await request(app)
        .post(`/api/payments/${pendingPaymentId}/approve`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          payment_method: 'cash',
          amount_paid: 35.00
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Doctor Consultation, Laboratory Request & Billable Verification', () => {
    let visitId;
    let procedureRequestId;

    it('should initiate doctor consultation for queued patient', async () => {
      // Find patient 1 visit (Robert Johnson)
      const queueRes = await request(app)
        .get('/api/consultations/queue')
        .set('Authorization', `Bearer ${doctorToken}`);

      const visit = queueRes.body.queue[0];
      visitId = visit.id;

      const res = await request(app)
        .post('/api/consultations')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          visit_id: visit.id,
          patient_id: visit.patient_id,
          symptoms: 'Patient reports severe throbbing headache and lightheadedness.',
          examination_findings: 'BP 140/90 mmHg, alert and oriented.',
          diagnosis: 'Uncontrolled Hypertension'
        });

      expect(res.status).toBe(201);
      expect(res.body.consultation.status).toBe('in_progress');
    });

    it('should allow doctor to order laboratory tests (CBC & Lipid Panel)', async () => {
      const servicesRes = await request(app)
        .get('/api/services?category=laboratory')
        .set('Authorization', `Bearer ${doctorToken}`);

      const cbc = servicesRes.body.services.find(s => s.service_code === 'LAB-CBC-01');
      const lipid = servicesRes.body.services.find(s => s.service_code === 'LAB-LIP-01');

      const res = await request(app)
        .post('/api/procedure-requests')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          visit_id: visitId,
          patient_id: 1,
          category: 'laboratory',
          clinical_reason: 'Screening for hyperlipidemia and secondary anemia',
          service_ids: [cbc.id, lipid.id]
        });

      expect(res.status).toBe(201);
      expect(res.body.procedure_request.status).toBe('awaiting_payment');
      expect(res.body.payment_required).toBe(900.00); // 350 + 550 ETB

      procedureRequestId = res.body.procedure_request.id;
    });

    it('should PREVENT laboratory technician from starting test before payment approval', async () => {
      const res = await request(app)
        .post(`/api/laboratory/start/${procedureRequestId}`)
        .set('Authorization', `Bearer ${labTechToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Payment has not been approved');
    });

    it('should allow receptionist to approve procedure fee payment', async () => {
      // Find the payment associated with the procedure request
      const payRes = await request(app)
        .get('/api/payments?status=pending')
        .set('Authorization', `Bearer ${receptionistToken}`);

      const procPayment = payRes.body.payments.find(p =>
        p.allocations && p.allocations.some(a => a.procedure_request_id === procedureRequestId)
      );

      expect(procPayment).toBeDefined();

      const approveRes = await request(app)
        .post(`/api/payments/${procPayment.id}/approve`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          payment_method: 'telebirr',
          amount_paid: 900.00,
          transaction_reference: 'TB-AUTH-8821'
        });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.payment.status).toBe('approved');
    });

    it('should now allow laboratory technician to start test and submit findings', async () => {
      // 1. Start test
      const startRes = await request(app)
        .post(`/api/laboratory/start/${procedureRequestId}`)
        .set('Authorization', `Bearer ${labTechToken}`);

      expect(startRes.status).toBe(200);
      expect(startRes.body.procedure_request.status).toBe('in_progress');

      // 2. Submit results
      const submitRes = await request(app)
        .post('/api/laboratory/results')
        .set('Authorization', `Bearer ${labTechToken}`)
        .send({
          request_id: procedureRequestId,
          test_name: 'Complete Blood Count & Lipid Panel',
          findings: 'Hemoglobin: 14.2 g/dL (Normal). Total Cholesterol: 245 mg/dL (Elevated). Triglycerides: 195 mg/dL.',
          observations: 'Mild hypercholesterolemia noted. Normal hemogram.',
          mark_sent_to_doctor: true
        });

      expect(submitRes.status).toBe(201);
      expect(submitRes.body.procedure_request.status).toBe('sent_to_doctor');
    });
  });

  describe('4. Dashboard Stats and Audit Reporting', () => {
    it('should provide comprehensive stats across all departments', async () => {
      const res = await request(app)
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stats.admin.total_revenue).toBeGreaterThan(0);
      expect(res.body.stats.reception.total_patients).toBeGreaterThan(0);
      expect(res.body.stats.laboratory).toBeDefined();
    });

    it('should record and return audit log entries for sensitive events', async () => {
      const res = await request(app)
        .get('/api/reports/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.logs.length).toBeGreaterThan(0);
    });
  });

  describe('5. Admin User Management (Add and Delete Staff Accounts)', () => {
    let newDoctorId;

    it('should allow Admin to create a new doctor account', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Bethlehem Tadesse',
          email: 'bethlehem@clinic.com',
          password: 'Doctor@123',
          role: 'doctor',
          phone: '+251 91 199 8877'
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe('Dr. Bethlehem Tadesse');
      expect(res.body.user.role).toBe('doctor');
      newDoctorId = res.body.user.id;
    });

    it('should prevent deleting oneself (currently authenticated admin)', async () => {
      // Decode or check admin
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app)
        .delete(`/api/users/${meRes.body.user.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cannot delete your own');
    });

    it('should allow Admin to delete a doctor or lab technician account', async () => {
      const res = await request(app)
        .delete(`/api/users/${newDoctorId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('successfully deleted');

      // Verify user is gone
      const checkRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      const found = checkRes.body.users.find(u => u.id === newDoctorId);
      expect(found).toBeUndefined();
    });
  });
});
