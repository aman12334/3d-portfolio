import { Bot } from "lucide-react";
import { CardBody, CardContainer, CardItem } from "./3d-card-effect";

export default function ThreeDCardDemo() {
  return (
    <CardContainer className="work-card-root" containerClassName="work-card-container">
      <CardBody className="work-card-body">
        <CardItem translateZ={60} className="work-card-title">
          Make things float in air
        </CardItem>
        <CardItem translateZ={42} className="work-card-category">
          Hover over this card to unleash CSS perspective
        </CardItem>
        <CardItem translateZ={78} className="work-card-image-wrap">
          <img
            src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1600&auto=format&fit=crop"
            className="work-card-image"
            alt="thumbnail"
          />
        </CardItem>
        <div className="work-card-footer">
          <CardItem translateZ={30} className="work-card-icon">
            <Bot size={18} />
          </CardItem>
          <CardItem as="a" href="#" translateZ={30} className="work-card-link">
            Try now
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  );
}
