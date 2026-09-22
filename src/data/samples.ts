export interface SampleCase {
  id: string;
  name: string;
  category: 'Job Offer' | 'Rental Scam' | 'Placement Fee' | 'Legitimate';
  expectedRisk: 'Critical Risk' | 'High Risk' | 'Legitimate';
  badgeColor: string;
  url: string;
  senderEmail: string;
  text: string;
}

export const SAMPLE_CASES: SampleCase[] = [
  {
    id: 'fake-tech-equipment',
    name: 'Remote Data Entry: Equipment Check Phishing',
    category: 'Job Offer',
    expectedRisk: 'Critical Risk',
    badgeColor: 'text-rose-600 bg-rose-50 border-rose-200',
    url: 'https://careers-googlecloud-verify.top/jobs/apply',
    senderEmail: 'hr-recruiting@googlecloud-careers.xyz',
    text: `Subject: URGENT: Formal Employment Offer - Senior Remote Data Entry Specialist ($65/hr)

Dear Applicant,

Following your brief 10-minute text questionnaire conducted via Telegram messenger, the hiring committee at Google Cloud Technologies LLC is pleased to extend you an immediate offer of employment for the position of Remote Operations Specialist.

Salary: $65.00 per hour (Bi-weekly disbursement via Direct Deposit or Check)
Hours: Flexible 30-40 hours per week (No prior experience required)

CONDITIONAL REQUIREMENT & HOME OFFICE WORKSTATION:
To set up your home workstation according to our corporate compliance guidelines, you will receive an advance cashier's check of $4,850.00 mailed to your home address tomorrow morning. 

Upon receipt, you are instructed to immediately deposit this check at your local bank ATM or mobile banking app. Within 24 hours of clearance, you must wire $4,200.00 to our authorized hardware vendor via Zelle or Bitcoin ATM to procure your encrypted Apple MacBook Pro, time-tracking peripherals, and proprietary VPN hardware. You may retain the remaining $650.00 as your sign-on stipend.

Failure to transmit payment to the vendor within 48 hours will void your employment agreement and may lead to immediate legal recovery.

Please reply with your full legal name, home address, SSN, and banking institution name immediately to accept.

Sincerely,
Dr. Robert Vance, Global Talent Acquisition
Google Cloud Technologies LLC
Telegram: @GoogleHR_Vance`
  },
  {
    id: 'fake-rental-deposit',
    name: 'Apartment Rental: Advance Wire Trap',
    category: 'Rental Scam',
    expectedRisk: 'Critical Risk',
    badgeColor: 'text-amber-600 bg-amber-50 border-amber-200',
    url: 'https://seattle-luxury-apartments-direct.co/listing-409',
    senderEmail: 'landlord.rev.williams@gmail.com',
    text: `Subject: Re: Inquiry for 2BR Luxury Penthouse - 1420 5th Ave ($1,200/mo all utilities included)

Hello,

Thank you for your interest in leasing our furnished 2-bedroom luxury penthouse. The unit is currently vacant and available for immediate move-in at $1,200 per month (market value is $3,800, but I am offering a discount because I am currently on an emergency missionary trip with UNICEF in West Africa and only seek a God-fearing tenant who will take good care of the premises).

Due to high demand and numerous fraudulent inquiries, in-person viewings are strictly suspended until a refundable security deposit of $1,500 plus first month's rent ($2,700 total) is received. 

Once you wire the funds via Western Union or Apple Cash to my escrow coordinator, the keys and original lease deed will be dispatched to you overnight via FedEx Express delivery, along with the gate security code. If you inspect the apartment and do not like it, 100% of your deposit will be refunded immediately without deduction.

Do not attempt to contact the building concierge directly as they are not authorized to discuss private leasing affairs.

Please fill out the attached lease form with your driver's license photo and wire the deposit receipt within 12 hours to lock in this price.

Blessings,
Rev. Jonathan Williams (Owner)`
  },
  {
    id: 'placement-training-fee',
    name: 'Guaranteed IT Job: Upfront Training Fee',
    category: 'Placement Fee',
    expectedRisk: 'High Risk',
    badgeColor: 'text-amber-600 bg-amber-50 border-amber-200',
    url: 'https://apex-tech-placements.biz/fasttrack',
    senderEmail: 'offers@apex-talentgroup.net',
    text: `Subject: Congratulations! Selected for Fortune 500 AI Engineer Placement ($110k Guaranteed)

Dear Candidate,

We reviewed your profile on an external resume database and have selected you for an exclusive Fast-Track placement with our Fortune 500 tech partners (including Amazon, Microsoft, and Meta).

No technical interview is required based on your pre-screen qualification!

To activate your guaranteed placement contract and visa/background sponsorship:
1. You must enroll in our mandatory 3-day Cloud Certification Module.
2. An upfront administrative & certification clearance fee of $899 is required, payable through PayPal Friends & Family or cryptocurrency (USDT).
3. This fee is 100% reimbursed on your first corporate paycheck.

Seats are limited to 3 candidates this cohort. If payment is not confirmed within 6 hours, your spot will be forfeited to the next applicant on the waitlist.

Regards,
FastTrack Onboarding Team
Apex Global Talent Solutions`
  },
  {
    id: 'legitimate-job-offer',
    name: 'Legitimate Enterprise Software Engineer Offer',
    category: 'Legitimate',
    expectedRisk: 'Legitimate',
    badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    url: 'https://careers.stripe.com',
    senderEmail: 'recruiting-team@stripe.com',
    text: `Subject: Formal Offer of Employment: Software Engineer - Stripe, Inc.

Dear Alex,

On behalf of Stripe, Inc., we are thrilled to offer you the full-time position of Software Engineer on our Core Infrastructure team, reporting to Sarah Jenkins, Engineering Director.

Compensation and Benefits:
- Starting Annual Base Salary: $165,000 USD, paid semi-monthly.
- Annual Performance Bonus Target: 15% of base salary.
- Restricted Stock Units (RSUs): Valued at $120,000 USD over a 4-year vesting schedule.
- Comprehensive medical, dental, and vision coverage through reputable tier-1 insurers.
- 401(k) retirement plan with employer matching up to 4%.

Equipment & Onboarding:
All necessary computer hardware (standard corporate MacBook Pro and security tokens) will be pre-configured by Stripe IT and shipped directly to your residential address at zero cost to you. Stripe will never ask you to pay for equipment, purchase gift cards, or wire money to third-party vendors.

Background Check:
This offer is contingent upon successful completion of a standard background check administered by Checkr, Inc. You will receive a separate automated invitation directly from their official portal.

Please review the complete offer letter and electronic agreement via our secure Workday portal link by Friday, October 24.

Sincerely,
David Ramirez
Senior Technical Recruiter | Stripe, Inc.
careers.stripe.com`
  },
  {
    id: 'tcs-wfh-security-deposit',
    name: 'India Tech WFH: ₹12,500 Laptop Deposit & WhatsApp Task Scam',
    category: 'Job Offer',
    expectedRisk: 'Critical Risk',
    badgeColor: 'text-rose-600 bg-rose-50 border-rose-200',
    url: 'https://tcs-careers-onboarding.top/portal/offer',
    senderEmail: 'hr-campus-recruitment@tcs-careers.xyz',
    text: `Subject: Tata Consultancy Services - Provisional Letter of Appointment (Off-Campus Drive)

Dear Candidate,

Congratulations! Based on your resume screening, the HR Operations Panel at Tata Consultancy Services (TCS iON Onboarding) has selected you for the role of Associate Software Trainee (Work From Home / Hybrid, CTC ₹6.2 LPA).

ONBOARDING & LAPTOP ALLOCATION DIRECTIVE:
As per our 2026 remote work safety policy, an enterprise-grade Dell Latitude laptop with TCS secure VPN access has been reserved in your name at our Bengaluru tech park hub.

To dispatch your IT hardware via Blue Dart express courier, you are required to submit a 100% refundable Laptop Security Deposit of ₹12,500 (Rupees Twelve Thousand Five Hundred) to our authorized IT provisioning partner via UPI or IMPS within 24 hours.

Please note:
1. This deposit is fully refunded along with your joining kit bonus on your first salary disbursement.
2. Failure to transfer the deposit within 24 hours will lead to cancellation of your appointment letter and release of your candidate ID.
3. Interviews for remote tasks are coordinated exclusively via our HR Telegram helpline: @TCS_HR_Recruitment_Team.

Kindly send your Aadhaar Card, PAN Card, and UPI payment screenshot to complete onboarding.

Warm regards,
Sunil Sharma
Senior Talent Acquisition Manager
Tata Consultancy Services
Telegram: @TCS_HR_Recruitment_Team`
  }
];
