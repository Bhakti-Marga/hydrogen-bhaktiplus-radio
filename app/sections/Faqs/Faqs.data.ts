import { Faq, FaqsSchema } from "./Faqs.schema";

export const FaqItems: Faq[] = [
  {
    question: "Title goes here",
    answer: "Answer goes here. Answer goes here. Answer goes here. Answer goes here. Answer goes here. ",
  },
  {
    question: "Title 2 goes here",
    answer: "Answer goes here. Answer goes here. Answer goes here. Answer goes here. Answer goes here. ",
  },
  {
    question: "Title 3 goes here",
    answer: "Answer goes here. Answer goes here. Answer goes here. Answer goes here. Answer goes here. ",
  },
  {
    question: "Title 4 goes here",
    answer: "Answer goes here. Answer goes here. Answer goes here. Answer goes here. Answer goes here. ",
  },
  {
    question: "Title 5 goes here",
    answer: "Answer goes here. Answer goes here. Answer goes here. Answer goes here. Answer goes here. ",
  },
  {
    question: "Title 6 goes here",
    answer: "Answer goes here. Answer goes here. Answer goes here. Answer goes here. Answer goes here. ",
  },
  {
    question: "Title 7goes here",
    answer: "Answer goes here. Answer goes here. Answer goes here. Answer goes here. Answer goes here. ",
  }
];

export const FaqsData: FaqsSchema = {
  title: "Frequently Asked Questions",
  faqs: FaqItems,
};