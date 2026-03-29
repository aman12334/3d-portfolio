import "./styles/About.css";

const About = () => {
  return (
    <div className="about-section" id="about">
      <div className="about-me">
        <h3 className="title">About Me</h3>
        <p className="para">
          I am a product manager focused on platform products, internal tools, and
          operational systems. I work in environments where workflows are manual,
          data is fragmented, and execution breaks at scale, then turn those
          constraints into reliable, measurable systems.
          <br />
          <br />
          Across supply chain, fintech, and enterprise contexts, I have built
          forecasting models, decision-support tools, workflow automation, and
          integrations used by operators, analysts, and leadership teams. I care
          deeply about clear system boundaries, disciplined execution, and
          long-term stability over short-term polish.
          <br />
          <br />I hold an MBA from the University of Maryland, Robert H. Smith
          School of Business, and I am especially interested in applying data,
          automation, and AI to real-world operational problems.
        </p>
      </div>
    </div>
  );
};

export default About;
