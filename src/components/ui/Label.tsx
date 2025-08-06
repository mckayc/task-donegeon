
import React from 'react';

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={`text-sm font-medium leading-none text-donegeon-text/80 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block ${className}`}
    {...props}
  />
));
Label.displayName = 'Label';

export { Label };
