import {
  BriefcaseBusiness,
  Building2,
  ChartNoAxesCombined,
  Handshake,
  Landmark,
} from "lucide-react";
import { CardItem, ExpandingCards } from "./expanding-cards";

const careerCards: CardItem[] = [
  {
    id: "nike",
    title: "Nike",
    role: "Product Management Intern",
    year: "2024",
    description:
      "Built a 20-quarter strategic estimation model reducing variable cost per unit by 16% across 400M units.",
    imgSrc: "/images/company-logos/1-nike.png",
    icon: <ChartNoAxesCombined size={20} />,
    linkHref: "#",
  },
  {
    id: "fruition",
    title: "Fruition Micro Credit",
    role: "Senior Product Manager",
    year: "2023-24",
    description:
      "Led roadmap and workflow redesign to reduce loan processing time from 8 days to 3 days.",
    imgSrc: "/images/company-logos/2-fruition.png",
    icon: <Handshake size={20} />,
    linkHref: "#",
  },
  {
    id: "deloitte",
    title: "Deloitte",
    role: "Product Manager",
    year: "2023",
    description:
      "Introduced agile operating model and accelerated delivery predictability for key initiatives.",
    imgSrc: "/images/company-logos/3-deloitte.png",
    icon: <BriefcaseBusiness size={20} />,
    linkHref: "#",
  },
  {
    id: "publicis",
    title: "Publicis Sapient",
    role: "Associate Product Manager 2",
    year: "2021-22",
    description:
      "Built ETRM features and improved report generation speed by 40% on enterprise workflows.",
    imgSrc: "/images/company-logos/4-publicis-sapient.png",
    icon: <Landmark size={20} />,
    linkHref: "#",
  },
  {
    id: "eka",
    title: "Eka Software",
    role: "Associate Product Manager",
    year: "2018-21",
    description:
      "Shipped allocation capabilities that reduced manual effort and improved invoicing reliability.",
    imgSrc: "/images/company-logos/5-eka.png",
    icon: <Building2 size={20} />,
    linkHref: "#",
  },
];

export default function ExpandingCardsDemo() {
  return <ExpandingCards items={careerCards} defaultActiveIndex={0} />;
}
