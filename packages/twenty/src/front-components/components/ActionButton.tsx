import styled from '@emotion/styled';
import { themeCssVariables } from 'twenty-ui/theme-constants';

// twenty-ui/input pulls in the code editor, and with it monaco-editor, which
// the app bundler cannot resolve. A plain styled button avoids the whole chain.
const StyledButton = styled.button<{ isSecondary?: boolean }>`
  background: ${({ isSecondary }) =>
    isSecondary
      ? themeCssVariables.background.transparent.light
      : themeCssVariables.color.blue};
  border: 1px solid ${() => themeCssVariables.border.color.medium};
  border-radius: ${() => themeCssVariables.border.radius.sm};
  color: ${({ isSecondary }) =>
    isSecondary ? themeCssVariables.font.color.primary : '#fff'};
  cursor: pointer;
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.sm};
  font-weight: ${() => themeCssVariables.font.weight.medium};
  padding: 6px 12px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

type ActionButtonProps = {
  title: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  onClick: () => void;
};

export const ActionButton = ({
  title,
  disabled,
  variant = 'primary',
  onClick,
}: ActionButtonProps) => (
  <StyledButton
    type="button"
    disabled={disabled}
    isSecondary={variant === 'secondary'}
    onClick={onClick}
  >
    {title}
  </StyledButton>
);
