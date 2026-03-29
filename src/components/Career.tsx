import "./styles/Career.css";

const Career = () => {
  return (
    <div className="career-section section-container">
      <div className="career-container">
        <h2>
          My career <span>&</span>
          <br /> experience
        </h2>
        <div className="career-info">
          <div className="career-timeline">
            <div className="career-dot"></div>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>Product Management Intern</h4>
                <h5>Nike Inc.</h5>
              </div>
              <h3>2024</h3>
            </div>
            <p>
              Built a 20-quarter strategic estimation model to optimize digital
              and non-digital cost structures, reducing direct variable cost per
              unit by 16% across 400M units. Evaluated temp-to-full-time
              conversion strategy at North American Logistics Campus with a $40M
              cost implication analysis.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>Senior Product Manager</h4>
                <h5>Fruition Micro Credit</h5>
              </div>
              <h3>2023–24</h3>
            </div>
            <p>
              Led a loan management platform from 0 to 1 in a bootstrapped
              startup environment. Defined roadmap, translated business needs into
              user-facing features, and redesigned workflows to reduce loan
              processing time from 8 days to 3 days for underserved women
              entrepreneurs.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>Product Manager</h4>
                <h5>Deloitte Touche</h5>
              </div>
              <h3>2023</h3>
            </div>
            <p>
              Introduced Agile ways of working to improve project planning and
              execution. Conducted research and analysis, presented
              implementation recommendations to management, and supported adoption
              for faster, more predictable delivery.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>Associate Product Manager 2</h4>
                <h5>Publicis Sapient</h5>
              </div>
              <h3>2021–22</h3>
            </div>
            <p>
              Delivered ETRM products for ENI SpA including a carbon-neutral
              feature that improved time efficiency by 70% and enabled 1,500
              deals. Launched energy-swap commodity functionality with Java/SQL
              and reduced report generation time by 40%.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>Associate Product Manager</h4>
                <h5>Eka Software</h5>
              </div>
              <h3>2018–21</h3>
            </div>
            <p>
              Built key CTRM/ETRM capabilities, including an allocation feature
              that reduced manual contract processing effort by roughly 10 minutes
              per contract while improving invoicing accuracy and stock
              allocation reliability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Career;
