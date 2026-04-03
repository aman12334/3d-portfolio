import {
  Building2,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Handshake,
  Landmark,
} from "lucide-react";
import { CardItem, ExpandingCards } from "./ui/expanding-cards";
import "./styles/Career.css";

const EXPERIENCE_ITEMS: CardItem[] = [
  {
    id: "nike",
    title: "Nike",
    role: "Product Management Intern",
    year: "2024",
    description:
      "Built a 20-quarter strategic estimation model to optimize digital and non-digital cost structures, reducing direct variable cost per unit by 16% across 400M units. Evaluated temp-to-full-time conversion strategy at North American Logistics Campus with a $40M cost implication analysis.",
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
      "Led a loan management platform from 0 to 1 in a bootstrapped startup environment. Defined roadmap, translated business needs into user-facing features, and redesigned workflows to reduce loan processing time from 8 days to 3 days for underserved women entrepreneurs.",
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
      "Introduced Agile ways of working to improve project planning and execution. Conducted research and analysis, presented implementation recommendations to management, and supported adoption for faster, more predictable delivery.",
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
      "Delivered ETRM products for ENI SpA including a carbon-neutral feature that improved time efficiency by 70% and enabled 1,500 deals. Launched energy-swap commodity functionality with Java/SQL and reduced report generation time by 40%.",
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
      "Built key CTRM/ETRM capabilities, including an allocation feature that reduced manual contract processing effort by roughly 10 minutes per contract while improving invoicing accuracy and stock allocation reliability.",
    imgSrc: "/images/company-logos/5-eka.png",
    icon: <Building2 size={20} />,
    linkHref: "#",
  },
];

const Career = () => {
  return (
    <section className="career-section section-container" id="career">
      <h2>
        My career <span>&</span>
        <br /> experience
      </h2>

      <div className="career-expanding-wrapper">
        <ExpandingCards items={EXPERIENCE_ITEMS} defaultActiveIndex={null} />
      </div>
    </section>
  );
};

export default Career;
