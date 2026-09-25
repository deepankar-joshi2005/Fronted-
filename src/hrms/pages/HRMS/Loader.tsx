/** @format */
import styled from "styled-components";

// Sidebar/navbar's --sidebar-primary blue (src/hrms/index.css) — kept in sync
// here rather than reading the CSS var, since Loader can render before the
// layout (and its stylesheet) has mounted.
const Loader = () => {
  return (
    <StyledWrapper role="status" aria-label="Loading">
      <div className="spinner" />
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  position: absolute;
  inset: 0;
  z-index: 50;

  display: flex;
  align-items: center;
  justify-content: center;

  .spinner {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 3.5px solid rgba(59, 130, 246, 0.15);
    border-top-color: #3b82f6;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export default Loader;

