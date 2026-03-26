export interface FaqsSchema {
  title: string;
  faqs: Faq[];
}

export interface Faq {
  question: string;
  answer: string;
}
