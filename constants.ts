
import { EvidenceItem, FraudMethod, QuizQuestion, TimelineEvent } from './types';

export const HISTORICAL_TIMELINE: TimelineEvent[] = [
  { date: 'Dec 2000', event: 'Line costs begin to be improperly capitalized to hide network access expenses.' },
  { date: 'Feb 2001', event: 'Fraudulent entries directed by CFO Scott Sullivan begin in earnest.' },
  { date: 'Apr 2002', event: 'CEO Bernard Ebbers resigns under pressure from the board.' },
  { date: 'Jun 2002', event: 'Internal auditor Cynthia Cooper discovers $3.8B in fraudulent accounting.' },
  { date: 'Jul 21, 2002', event: 'WorldCom files for Chapter 11 bankruptcy, the largest in US history at the time.' }
];

export const FRAUD_METHODS: FraudMethod[] = [
  {
    name: 'Line Cost Capitalization',
    description: 'Operating expenses for network access fees were recorded as capital expenditures (assets), inflating profit.',
    amount: '$3.8 Billion'
  },
  {
    name: 'Accrual Releases',
    description: 'Reserve accounts were released into the income statement to reduce expenses without justification.',
    amount: '$2+ Billion'
  }
];

export const INITIAL_EVIDENCE: EvidenceItem[] = [
  {
    id: 'prepaid_capacity',
    name: 'Prepaid Capacity Memo',
    description: 'Suspicious accounting entries totaling millions.',
    found: false,
    position: { x: 15, y: 2, z: 10 },
    document: {
      title: 'Prepaid Capacity Analysis',
      content: ' Auditor Gene Morse discovered unusual entries labeled "prepaid capacity". These entries showed massive transfers from the income statement to the balance sheet. By capitalizing these costs, WorldCom converted expenses into assets, inflating profits.'
    }
  },
  {
    id: 'monrev_report',
    name: 'MonRev Report',
    description: 'Secret monthly revenue tracking document.',
    found: false,
    position: { x: -25, y: 2, z: 20 },
    document: {
      title: 'MonRev (Monthly Revenue) Report',
      content: 'This report revealed the true state of revenue versus reported numbers. At quarter-end, management met to "close the gap" between actual revenue and Wall Street targets through round-number fraudulent journal entries.'
    }
  },
  {
    id: 'line_costs',
    name: 'Line Cost Analysis',
    description: '$3.8B in hidden expenses discovered.',
    found: false,
    position: { x: 5, y: 2, z: -30 },
    document: {
      title: 'Line Cost Capitalization',
      content: 'WorldCom paid fees to other telecom providers for network access. Instead of expensing these "line costs," they were recorded as capital assets. This moved massive costs off the P&L statement.'
    }
  },
  {
    id: 'ebbers_loans',
    name: 'Personal Loan Records',
    description: '$400M in loans to CEO Ebbers.',
    found: false,
    position: { x: -35, y: 2, z: -15 },
    document: {
      title: 'Personal Loans to Bernard Ebbers',
      content: 'The board authorized over $400M in loans to the CEO to cover margin calls on his WorldCom stock. This created a profound conflict of interest, motivating the CEO to keep the stock price high at any cost.'
    }
  }
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: 'What was the primary accounting fraud method used by WorldCom in 2001-2002?',
    options: [
      'Inventory theft',
      'Capitalizing operating expenses as assets',
      'Hiding debt in offshore vehicles',
      'Overstating customer counts'
    ],
    correct: 1,
    explanation: 'WorldCom capitalized $3.8 billion in "line costs" which should have been recorded as expenses, thereby artificially inflating their assets and profit.'
  },
  {
    question: 'Who led the internal audit team that exposed the fraud?',
    options: [
      'Bernard Ebbers',
      'Scott Sullivan',
      'Cynthia Cooper',
      'Arthur Andersen'
    ],
    correct: 2,
    explanation: 'Cynthia Cooper, VP of Internal Audit, and her team worked secretly to uncover the fraudulent entries.'
  }
];
