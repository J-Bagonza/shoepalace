export type ContentBlockType =
  | "heading"
  | "paragraph"
  | "policy_item"
  | "faq_item"
  | "contact_item";

export interface HeadingBlock {
  type: "heading";
  text: string;
}

export interface ParagraphBlock {
  type: "paragraph";
  text: string;
}

export interface PolicyItemBlock {
  type: "policy_item";
  title: string;
  body: string;
}

export interface FaqItemBlock {
  type: "faq_item";
  question: string;
  answer: string;
}

export interface ContactItemBlock {
  type: "contact_item";
  label: string;
  value: string;
}

export type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | PolicyItemBlock
  | FaqItemBlock
  | ContactItemBlock;

export interface CmsPage {
  id: string;
  tenant_id: string;
  slug: string;
  title: string;
  content: ContentBlock[];
  created_at: string;
  updated_at: string;
}