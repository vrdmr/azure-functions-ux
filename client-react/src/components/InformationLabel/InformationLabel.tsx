import React, { FC, useContext } from 'react';
import ReactiveFormControl from '../form-controls/ReactiveFormControl';
import { Label, Link, Icon } from '@fluentui/react';
import { style } from 'typestyle';
import { ThemeContext } from '../../ThemeContext';
import { ThemeExtended } from '../../theme/SemanticColorsExtended';
import { labelValueStyle } from './InformationLabel.styles';

export interface CustomInformationLabelProps {
  id: string;
  value: string;
  label: string;
  link?: string;
  labelProps?: {
    icon?: string;
    type?: string;
  };
  className?: string;
  onClick?: () => void;
  linkWithLabel?: {
    href: string;
    value: string;
  };
}

const labelIconStyle = style({
  fontSize: '12px',
  marginRight: '4px',
});

const getLabelColor = (type: 'success' | 'error' | undefined, theme: ThemeExtended) => {
  if (type === 'success') {
    return theme.semanticColors.inlineSuccessText;
  } else if (type === 'error') {
    return theme.semanticColors.inlineErrorText;
  } else if (type === 'info') {
    return theme.semanticColors.primaryButtonBackground;
  } else {
    return theme.semanticColors.textColor;
  }
};

const defaultLabelStyle = (theme: ThemeExtended) =>
  style({
    color: theme.semanticColors.textColor,
  });

const getLabelStyle = (labelProps: any, theme: ThemeExtended) => {
  return labelProps && labelProps.type
    ? style({
        color: getLabelColor(labelProps.type, theme),
      })
    : defaultLabelStyle(theme);
};

const InformationLabel: FC<CustomInformationLabelProps> = props => {
  const { value, id, link, labelProps, className, onClick, linkWithLabel } = props;
  const theme = useContext(ThemeContext);

  const getClassNameFromProps = () => {
    if (className) {
      return className;
    }
    return labelProps ? getLabelStyle(labelProps, theme) : '';
  };

  return (
    <ReactiveFormControl {...props}>
      {link ? (
        <Link id={`${id}-value-link`} href={link} target="_blank" aria-labelledby={`${id}-label`}>
          {value}
        </Link>
      ) : (
        <Label id={`${id}-value`} aria-labelledby={`${id}-label`} onClick={onClick} className={getClassNameFromProps()}>
          {labelProps && labelProps.icon && <Icon iconName={labelProps.icon} className={labelIconStyle} />}
          <span className={labelValueStyle(theme)}>{value}</span>
          {!!linkWithLabel && (
            <Link href={linkWithLabel.href} target="_blank">
              {linkWithLabel.value}
            </Link>
          )}
        </Label>
      )}
    </ReactiveFormControl>
  );
};
export default InformationLabel;
