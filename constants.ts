
import { DecisionPoint, FraudMethod, QuizQuestion, TimelineEvent, KeyFigure, ImpactFact, GameLevel, AuditRank } from './types';

export const GAME_LEVELS: GameLevel[] = [
  {
    id: 1,
    title: "1999: The Height of the Bubble",
    rank: AuditRank.CFO,
    targetEPS: "$0.30",
    description: "The stock is soaring at $64. The Sprint merger is on the table. We need to show efficiency to get regulatory approval. Keep the Expense-to-Revenue (E/R) ratio down."
  },
  {
    id: 2,
    title: "Q3 2000: The Burst & The Failed Merger",
    rank: AuditRank.CFO,
    targetEPS: "$0.45",
    description: "Regulators blocked the Sprint merger. The Dot-com bubble burst. Customers are defaulting. We are $685M short on revenue. Wall Street still expects double-digit growth."
  },
  {
    id: 3,
    title: "Q1 2001: The Slippery Slope",
    rank: AuditRank.CFO,
    targetEPS: "$0.52",
    description: "Line costs are eating our profits. The 'Prepaid Capacity' accounts are messy. Ebbers has $400M in margin calls and needs the stock high. We need to capitalize operating expenses."
  },
  {
    id: 4,
    title: "Q4 2001: The Deepening Hole",
    rank: AuditRank.CFO,
    targetEPS: "$0.60",
    description: "The fraud is now in the billions. We are moving line costs to Property, Plant & Equipment (PP&E). Vinson and Normand are threatening to quit. Keep them in line."
  },
  {
    id: 5,
    title: "Q2 2002: The House of Cards",
    rank: AuditRank.CFO,
    targetEPS: "$0.75",
    description: "The hole is $3.8 billion deep. Cynthia Cooper is interviewing the capital expenditure team. The SEC has sent a request for information. Survive."
  }
];

export const DECISION_POINTS: DecisionPoint[] = [
  // LEVEL 1: 1999
  {
    id: 'sprint_merger_synergies',
    title: 'Sprint Merger "Synergies"',
    problem: 'To justify the Sprint merger to the DOJ, we need to show lower Line Costs. Actual costs are 42% of revenue. We need them at 38%.',
    resolved: false,
    level: 1,
    position: { x: 10, y: 2, z: 10 },
    options: {
      honest: {
        label: "Report actual 42% ratio",
        stockImpact: -10.0,
        suspicionImpact: 0,
        description: "The DOJ sees we are inefficient. The merger might fail on economics alone. Stock dips.",
        aiPrompt: "Impact of high operating ratios on telecom merger approvals in 1999?"
      },
      fraud: {
        label: "Release $400M Tax Reserves",
        stockImpact: 5.0,
        suspicionImpact: 10,
        description: "Release old tax cushions into income to offset line costs. It's a 'one-time' adjustment.",
        aiPrompt: "Is releasing tax reserves to boost operating income GAAP compliant?"
      }
    }
  },
  {
    id: 'mci_integration_writeoff',
    title: 'MCI Integration Costs',
    problem: 'We have lingering costs from the MCI acquisition. We can write them off now or hide them.',
    resolved: false,
    level: 1,
    position: { x: -15, y: 2, z: -15 },
    options: {
      honest: {
        label: "Take the charge now",
        stockImpact: -5.0,
        suspicionImpact: 0,
        description: "Short term pain, but clean books.",
        aiPrompt: "Accounting treatment for merger integration costs."
      },
      // For simplicity in this demo structure, providing fraud option here even if historically subtle
      fraud: {
        label: "Double-dip the write-off",
        stockImpact: 8.0,
        suspicionImpact: 15,
        description: "Write off ordinary expenses as 'merger integration charges' to classify them as non-recurring.",
        aiPrompt: "What is 'Big Bath' accounting in mergers?"
      }
    }
  },

  // LEVEL 2: Q3 2000
  {
    id: 'bad_debt_reserve',
    title: 'The Bad Debt Crisis',
    problem: 'Dot-com clients (Terra, Webvan) are bankrupt. $685M in uncollectible bills. If we book this bad debt, we miss the quarter.',
    resolved: false,
    level: 2,
    position: { x: 25, y: 2, z: 25 },
    options: {
      honest: {
        label: "Write off debt",
        stockImpact: -25.0,
        suspicionImpact: -5,
        description: "Miss earnings by 15 cents. Stock crashes. Ebbers is furious.",
        aiPrompt: "Consequences of missing earnings estimates in 2000?"
      },
      fraud: {
        label: "Release Line Cost Reserves",
        stockImpact: 5.0,
        suspicionImpact: 20,
        description: "We have excess accruals for carrier disputes. Release them to revenue to cover the bad debt.",
        aiPrompt: "Using liability reserve releases to mask bad debt expense."
      }
    }
  },
  {
    id: 'unallocated_revenue',
    title: 'Corporate Unallocated',
    problem: 'The MonRev report shows we are short on revenue growth targets. The regions can\'t find any more sales.',
    resolved: false,
    level: 2,
    position: { x: -25, y: 2, z: 25 },
    options: {
      honest: {
        label: "Report flat revenue",
        stockImpact: -30.0,
        suspicionImpact: 0,
        description: "The 'Growth Story' ends. Analysts downgrade WorldCom from Buy to Hold.",
        aiPrompt: "Market reaction to flat revenue in a growth stock."
      },
      fraud: {
        label: "Book 'Unallocated' Revenue",
        stockImpact: 5.0,
        suspicionImpact: 25,
        description: "Journal Entry: Debit A/R, Credit Revenue. No customer attached. Just call it 'Corporate Unallocated'.",
        aiPrompt: "How to detect top-side journal entries with no supporting documentation?"
      }
    }
  },

  // LEVEL 3: Q1 2001
  {
    id: 'line_cost_capitalization',
    title: 'The Capitalization Plan',
    problem: 'Line costs are $771M over budget. There are no more reserves to release. We need a new way to hide expenses.',
    resolved: false,
    level: 3,
    position: { x: 40, y: 2, z: 0 },
    options: {
      honest: {
        label: "Report the loss",
        stockImpact: -40.0,
        suspicionImpact: 0,
        description: "The stock drops below $10. Ebbers receives margin calls.",
        aiPrompt: "What happens when a CEO gets margin called on their own company stock?"
      },
      fraud: {
        label: "Capitalize Line Costs",
        stockImpact: 10.0,
        suspicionImpact: 35,
        description: "Move $771M from 'Line Cost Expense' to 'Asset: Prepaid Capacity'. We depreciate it over 10 years instead of paying it now.",
        aiPrompt: "Difference between Operating Expense (OpEx) and Capital Expenditure (CapEx)."
      }
    }
  },
  {
    id: 'prepaid_capacity_memo',
    title: 'Prepaid Capacity Memo',
    problem: `TO: Scott Sullivan, CFO
FROM: David Myers, Controller
SUBJECT: Q3 Capitalization of Line Costs

Per your instruction, we are transferring $771 million of line cost expenses to the 'Prepaid Capacity' asset account. 

Please note that there is no supporting documentation for these entries. If the auditors ask for invoices, we do not have them.

This treatment is aggressive and likely violates GAAP matching principles.`,
    resolved: false,
    level: 3,
    position: { x: 0, y: 2, z: 0 },
    options: {
      honest: { label: '', stockImpact: 0, suspicionImpact: 0, description: '', aiPrompt: '' },
      fraud: { label: '', stockImpact: 0, suspicionImpact: 0, description: '', aiPrompt: '' }
    }
  },
  {
    id: 'betty_vinson_reluctance',
    title: 'The Accountants Rebel',
    problem: 'Betty Vinson and Troy Normand are refusing to make the entries. They know it is illegal.',
    resolved: false,
    level: 3,
    position: { x: -40, y: 2, z: 0 },
    options: {
      honest: {
        label: "Listen to them",
        stockImpact: -50.0,
        suspicionImpact: -10,
        description: "You stop the fraud. The company collapses, but you stay out of jail.",
        aiPrompt: "Whistleblower protections in 2001."
      },
      fraud: {
        label: "Coerce them",
        stockImpact: 2.0,
        suspicionImpact: 20,
        description: "Tell them it's just for one quarter. Tell them the plane will crash if they don't do it. Pay them a retention bonus.",
        aiPrompt: "Psychological tactics used in corporate fraud coercion."
      }
    }
  },

  // LEVEL 4: Q4 2001
  {
    id: 'ppe_transfers',
    title: 'Hiding in PP&E',
    problem: 'The "Prepaid Capacity" account is getting too big ($2B+). Auditors might notice. We need a better hiding spot.',
    resolved: false,
    level: 4,
    position: { x: 10, y: 2, z: -40 },
    options: {
      honest: {
        label: "Restate financials",
        stockImpact: -80.0,
        suspicionImpact: 80,
        description: "Admission of guilt. Immediate investigation.",
        aiPrompt: "Process of financial restatement."
      },
      fraud: {
        label: "Spread to PP&E",
        stockImpact: 5.0,
        suspicionImpact: 30,
        description: "Move the costs into general 'Property, Plant, and Equipment' accounts across thousands of assets so it's harder to trace.",
        aiPrompt: "How auditors verify Property, Plant, and Equipment (PP&E) assets."
      }
    }
  },

  // LEVEL 5: Q2 2002
  {
    id: 'cynthia_cooper_audit',
    title: 'Cooper\'s Investigation',
    problem: 'Cynthia Cooper (Internal Audit) found a $2B capital entry with no invoice. She is asking David Myers for backup.',
    resolved: false,
    level: 5,
    position: { x: -10, y: 2, z: -40 },
    options: {
      honest: {
        label: "Admit it's an error",
        stockImpact: -95.0,
        suspicionImpact: 100,
        description: "Game over. The fraud is revealed.",
        aiPrompt: "Impact of the WorldCom fraud discovery."
      },
      fraud: {
        label: "Block Access",
        stockImpact: -10.0,
        suspicionImpact: 50,
        description: "Tell Myers to delay her. Change the passwords to the accounting system. Say it's 'Prepaid Capacity' again.",
        aiPrompt: "Obstruction of justice charges in corporate fraud."
      }
    }
  },
  {
    id: 'andersen_collapse',
    title: 'Arthur Andersen Collapse',
    problem: 'Enron has collapsed. Our auditor, Arthur Andersen, is dissolving. The SEC is looking at all their clients, including us.',
    resolved: false,
    level: 5,
    position: { x: 0, y: 2, z: 50 },
    options: {
      honest: {
        label: "Cooperate with SEC",
        stockImpact: -90.0,
        suspicionImpact: 100,
        description: "You hand over the books.",
        aiPrompt: "SEC investigation procedures."
      },
      fraud: {
        label: "Shred Documents",
        stockImpact: 0.0,
        suspicionImpact: 60,
        description: "Destroy the memos regarding the capitalization strategy.",
        aiPrompt: "Legal consequences of shredding documents during an investigation."
      }
    }
  }
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // Level 1
  {
    level: 1,
    question: 'Analyst: "How did you achieve such low line costs despite the traffic increase?"',
    options: [
      'We renegotiated contracts efficiently.',
      'We released tax reserves.',
      'I will not answer that.',
      'Magic.'
    ],
    correct: 0,
    explanation: 'Lying to analysts was routine. Management cited "synergies" and "contract renegotiations" to explain artificial cost drops.'
  },
  // Level 2
  {
    level: 2,
    question: 'Board Member: "Why is our revenue growing when the rest of the industry is flat?"',
    options: [
      'We are taking market share from AT&T.',
      'We are booking fake revenue.',
      'The industry data is wrong.',
      'We are just better.'
    ],
    correct: 0,
    explanation: 'Ebbers constantly claimed WorldCom was a "growth stock" taking share from incumbents to mask the flat actuals.'
  },
  // Level 3
  {
    level: 3,
    question: 'Betty Vinson: "I can\'t do this entry Scott. It\'s just wrong. What account should I even use?"',
    options: [
      'Prepaid Capacity (Asset).',
      'Office Supplies (Expense).',
      'Salary Expense.',
      'Don\'t do it then.'
    ],
    correct: 0,
    explanation: 'The famous "Prepaid Capacity" account was used as a dumping ground for operating line costs.'
  },
  // Level 4
  {
    level: 4,
    question: 'Auditor: "We need to see the invoices for this $2B in capital spending."',
    options: [
      'It is a fixed-rate allocation, not invoice based.',
      'The dog ate them.',
      'Talk to the CEO.',
      'Here are the fake invoices.'
    ],
    correct: 0,
    explanation: 'Sullivan argued that the costs were fixed allocations for network capacity, implying they were assets, to avoid showing specific invoices.'
  },
  // Level 5
  {
    level: 5,
    question: 'SEC: "Mr. Sullivan, did you direct the capitalization of line costs?"',
    options: [
      'I rely on my accountants to follow GAAP.',
      'Yes, I did.',
      'What is capitalization?',
      'No comment.'
    ],
    correct: 0,
    explanation: 'Sullivan initially claimed he thought the entries were proper under a theory of "matching principle," shifting blame to interpretation.'
  }
];

export const HISTORICAL_TIMELINE: TimelineEvent[] = [
  { date: '1999', event: 'WorldCom stock peaks at $64. Failed merger with Sprint proposed.' },
  { date: 'July 2000', event: 'DOJ blocks Sprint merger. Dot-com bubble bursts.' },
  { date: 'Oct 2000', event: 'Third Quarter earnings warning. Stock drops.' },
  { date: '2001', event: '$3.8 Billion in Line Costs capitalized into assets.' },
  { date: 'Mar 2002', event: 'SEC requests information. Ebbers resigns in April.' },
  { date: 'June 2002', event: 'Cynthia Cooper unearths the fraud. WorldCom admits $3.8B error.' },
  { date: 'July 2002', event: 'WorldCom files for Chapter 11 Bankruptcy.' }
];

export const KEY_FIGURES: KeyFigure[] = [
  { name: 'Bernie Ebbers', role: 'CEO', avatar: '🤠', description: 'The Cowboy CEO. Obsessed with the stock price. Owes $400M on margin.', outcome: 'Convicted: 25 Years.' },
  { name: 'Scott Sullivan', role: 'CFO (You)', avatar: '📉', description: 'The Architect. Believed the revenue dip was temporary. Just needed to bridge the gap.', outcome: 'Convicted: 5 Years.' },
  { name: 'Cynthia Cooper', role: 'VP Internal Audit', avatar: '🕵️‍♀️', description: 'The Whistleblower. Worked at night to find the entries.', outcome: 'Time Person of the Year.' },
  { name: 'David Myers', role: 'Controller', avatar: '📋', description: 'Executed Sullivan\'s orders. "I thought we would fix it next quarter."', outcome: 'Convicted: 1 Year.' },
  { name: 'Betty Vinson', role: 'Director', avatar: '💻', description: 'Made the entries. Was told "just one more time".', outcome: 'Convicted: 5 Months.' }
];

export const WORLD_IMPACT: ImpactFact[] = [
  { title: 'Market Cap Lost', detail: 'From peak to trough.', stat: '$180B' },
  { title: 'Jobs Lost', detail: 'Employees laid off.', stat: '30,000' },
  { title: 'Pension Funds', detail: 'Retirement savings wiped out.', stat: '$1.1B' }
];

export const FRAUD_METHODS: FraudMethod[] = [
  { name: 'Cookie Jar Reserves', description: 'Releasing tax liabilities to revenue.', amount: '$3.3B' },
  { name: 'CapEx Transfers', description: 'Moving Line Costs to Assets.', amount: '$3.8B' },
  { name: 'Corporate Unallocated', description: 'Fake revenue entries.', amount: '$1.2B' }
];
