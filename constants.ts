
import { DecisionPoint, FraudMethod, QuizQuestion, TimelineEvent, KeyFigure, ImpactFact, GameLevel, AuditRank } from './types';

export const GAME_LEVELS: GameLevel[] = [
  {
    id: 1,
    title: "Q3 2000: The Slowdown",
    rank: AuditRank.CONTROLLER,
    targetEPS: "$0.45",
    description: "The Telecom bubble is bursting. Customers are defaulting. We are $685M short on revenue. Wall Street expects growth. Fix it."
  },
  {
    id: 2,
    title: "Q1 2001: The Slippery Slope",
    rank: AuditRank.CFO,
    targetEPS: "$0.52",
    description: "Line costs are eating our profits. The 'Prepaid Capacity' accounts are messy. Ebbers needs the stock high to cover his margin calls. Do whatever it takes."
  },
  {
    id: 3,
    title: "Q1 2002: The House of Cards",
    rank: AuditRank.CFO,
    targetEPS: "$0.75",
    description: "The hole is $3.8 billion deep. Internal Audit is asking questions. We need one last massive adjustment to keep the stock afloat before we can restructure."
  }
];

export const DECISION_POINTS: DecisionPoint[] = [
  // LEVEL 1
  {
    id: 'bad_debt_reserve',
    title: 'Unpaid Customer Bills',
    problem: 'Clients valued at $685M have gone bankrupt. If we write this off as a loss, we miss our earnings target.',
    resolved: false,
    level: 1,
    position: { x: 15, y: 2, z: 10 },
    options: {
      honest: {
        label: "Write off the bad debt",
        stockImpact: -15.0,
        suspicionImpact: -5,
        description: "You report the loss. The stock takes a hit. Ebbers screams at you in the boardroom.",
        aiPrompt: "What are the legal consequences of accurately reporting a massive bad debt write-off versus hiding it?"
      },
      fraud: {
        label: "Release Reserves to Income",
        stockImpact: 5.0,
        suspicionImpact: 15,
        description: "You dip into the reserve accounts intended for tax liabilities and count it as revenue. The books balance.",
        aiPrompt: "How can a company justify releasing tax reserves into income to hide operating losses?"
      }
    }
  },
  {
    id: 'line_cost_pressure',
    title: 'Rising Line Costs',
    problem: 'Network access fees are 45% of our revenue. Wall Street expects them to be 40%. We are $828M over budget.',
    resolved: false,
    level: 1,
    position: { x: 45, y: 2, z: -10 },
    options: {
      honest: {
        label: "Report the increased expense",
        stockImpact: -20.0,
        suspicionImpact: 0,
        description: "Investors panic. Analysts downgrade the stock. You are warned your job is at risk.",
        aiPrompt: "Explain the impact of high 'line costs' on a telecom company's stock price in 2000."
      },
      fraud: {
        label: "Use 'Cookie Jar' Reserves",
        stockImpact: 2.0,
        suspicionImpact: 20,
        description: "You direct Vinson to release $828M from a generic reserve liability account to offset the costs.",
        aiPrompt: "What is 'Cookie Jar Accounting' and why is it illegal?"
      }
    }
  },
  // LEVEL 2
  {
    id: 'prepaid_capacity_entry',
    title: 'The Prepaid Capacity Problem',
    problem: 'We have $2 Billion in unused network capacity fees. It looks like a massive waste of cash.',
    resolved: false,
    level: 2,
    position: { x: -25, y: 2, z: 20 },
    options: {
      honest: {
        label: "Expense it as operating cost",
        stockImpact: -30.0,
        suspicionImpact: -10,
        description: "The quarterly earnings turn red. Ebbers threatens to fire the entire finance department.",
        aiPrompt: "Why must operating expenses be deducted immediately rather than over time?"
      },
      fraud: {
        label: "Capitalize as Asset",
        stockImpact: 10.0,
        suspicionImpact: 35,
        description: "You record the fees as a 'Capital Asset' (Prepaid Capacity). This spreads the cost over 10 years, boosting today's profit.",
        aiPrompt: "Analyze the risk of capitalizing operating expenses (E/E to CapEx transfers) under GAAP."
      }
    }
  },
  {
    id: 'monrev_gap',
    title: 'The MonRev Gap',
    problem: 'The "MonRev" report shows actual revenue is flat. Reported revenue needs to show double-digit growth.',
    resolved: false,
    level: 2,
    position: { x: -60, y: 2, z: 45 },
    options: {
      honest: {
        label: "Adjust guidance down",
        stockImpact: -25.0,
        suspicionImpact: 0,
        description: "You tell the truth. The stock plummets to single digits.",
        aiPrompt: "What happens when a growth company suddenly reports flat revenue?"
      },
      fraud: {
        label: "Post 'Corporate Unallocated' Revenue",
        stockImpact: 8.0,
        suspicionImpact: 25,
        description: "You order a manual journal entry to add $100M in revenue labeled 'Corporate Unallocated' with no backup.",
        aiPrompt: "What are the indicators of a 'top-side' journal entry fraud?"
      }
    }
  },
  // LEVEL 3
  {
    id: 'andersen_audit',
    title: 'Auditor Inquiry',
    problem: 'Arthur Andersen is asking about the asset transfers. They want to see the capitalization policy.',
    resolved: false,
    level: 3,
    position: { x: 10, y: 2, z: -80 },
    options: {
      honest: {
        label: "Confess to Andersen",
        stockImpact: -99.0,
        suspicionImpact: 100,
        description: "The game is up. You hand over the files. The fraud is exposed immediately.",
        aiPrompt: "What is the role of an external auditor like Arthur Andersen in detecting fraud?"
      },
      fraud: {
        label: "Withhold Information",
        stockImpact: 0.0,
        suspicionImpact: 40,
        description: "You tell the auditors the methodology is proprietary and effective. You block their access to the smart ledger.",
        aiPrompt: "What are the penalties for obstructing a federal audit?"
      }
    }
  },
  {
    id: 'cynthia_cooper',
    title: 'Internal Audit Snooping',
    problem: 'Cynthia Cooper is asking for access to the Capital Expenditure server. She is suspicious.',
    resolved: false,
    level: 3,
    position: { x: -35, y: 2, z: -15 },
    options: {
      honest: {
        label: "Grant Access",
        stockImpact: -99.0,
        suspicionImpact: 100,
        description: "She finds the $3.8B entries. She goes to the board. It's over.",
        aiPrompt: "How did Cynthia Cooper uncover the WorldCom fraud?"
      },
      fraud: {
        label: "Delay and Obfuscate",
        stockImpact: -5.0,
        suspicionImpact: 50,
        description: "You tell her to wait until next quarter. You promote her boss to keep him quiet.",
        aiPrompt: "Describe the pressure placed on internal auditors during the WorldCom scandal."
      }
    }
  }
];

// Reusing Quiz Structure but as "Press Interviews" or "Board Questions"
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    level: 1,
    question: 'Board Member: "Why are we using reserves to pay for line costs?"',
    options: [
      'It is a standard GAAP procedure.',
      'We are just smoothing out a one-time anomaly.',
      'I am stealing money.',
      'We forgot to pay the bills.'
    ],
    correct: 1,
    explanation: 'Framing fraud as a "one-time fix" was a key tactic used to convince reluctant accountants to comply.'
  },
  {
    level: 2,
    question: 'Analyst Jack Grubman: "Your capital spending is high, but profits are up. Is this sustainable?"',
    options: [
      'No, we are cooking the books.',
      'Yes, we are investing in the future of the internet.',
      'Sell the stock now.',
      'I take the 5th amendment.'
    ],
    correct: 1,
    explanation: 'WorldCom constantly touted its investment in network capacity to justify high capital spending (which was actually hidden expenses).'
  },
  {
    level: 3,
    question: 'SEC Regulator: "Can you explain the $3.8 Billion difference between your cash flow and reported income?"',
    options: [
      'It is a complex prepaid capacity lease structure.',
      'It is fraud.',
      'Ask Arthur Andersen.',
      'I resign.'
    ],
    correct: 0,
    explanation: 'Obfuscation and complex terminology were used to confuse regulators and auditors.'
  }
];

export const HISTORICAL_TIMELINE: TimelineEvent[] = [
  { date: '1999', event: 'Revenue growth slows. Pressure mounts to maintain the stock price.' },
  { date: 'Q3 2000', event: 'First major fraudulent entry: $828M of reserves released to income.' },
  { date: '2001', event: 'CFO Sullivan directs the capitalization of $3.8B in line costs.' },
  { date: 'June 2002', event: 'Cooper finds the fraud. Sullivan fired. Stock hits $0.09.' }
];

export const KEY_FIGURES: KeyFigure[] = [
  { name: 'Bernard Ebbers', role: 'CEO', avatar: '👔', description: 'Your boss. He owes the bank $400M backed by WorldCom stock. If the stock drops, he is ruined.', outcome: 'Demands results.' },
  { name: 'Scott Sullivan', role: 'You (CFO)', avatar: '📊', description: 'The "Whiz Kid" of Wall Street. You believe you can fix the company if you just buy more time.', outcome: 'Current Status: Stressed.' },
  { name: 'Cynthia Cooper', role: 'Internal Audit', avatar: '🔍', description: 'Tenacious and detail-oriented. She is asking too many questions.', outcome: 'Threat Level: High.' }
];

export const WORLD_IMPACT: ImpactFact[] = [
  { title: 'Market Cap', detail: 'Current Value of WorldCom.', stat: '$120B' },
  { title: 'Employees', detail: 'Jobs at risk if we fail.', stat: '60,000' }
];

export const FRAUD_METHODS: FraudMethod[] = [
  { name: 'Cookie Jar Reserves', description: 'Releasing rainy-day funds to boost current profit.', amount: '$3.8B' },
  { name: 'CapEx Transfers', description: 'Hiding operating costs as long-term assets.', amount: '$3.8B' }
];
