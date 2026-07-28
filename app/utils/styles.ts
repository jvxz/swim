// @unocss-include
const interactiveStyles = {
  base: 'font-medium focus-visible:border-primary/50 select-none focus-visible:ring-ring/40 focus-visible:ring-[3px] active:ring-ring/60 dark:aria-[invalid]:ring-danger/40 shrink-0 gap-2 rounded text-base whitespace-nowrap outline-none disabled:pointer-events-none hover:disabled:cursor-not-allowed disabled:opacity-50 underline-offset-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 transition-transform duration-150',
  size: {
    default: 'h-7 px-2.25 py-1.5 text-sm',
    icon: 'aspect-square size-7',
    lg: 'h-10 px-5 text-base text-lg',
    sm: 'h-6.5 px-2.25 py-0.75 text-xs',
  },
  variant: {
    danger:
      'hover:bg-danger/90 bg-danger/90 text-danger-foreground hover:bg-danger active:bg-danger border-danger',
    default:
      'bg-primary/85 border hover:bg-primary/90 border-primary active:bg-primary/85 text-primary-foreground',
    ghost:
      'hover:bg-muted/90 active:bg-muted/75 text-muted-foreground hover:text-foreground active:text-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
    outline: 'hover:bg-muted/90 active:bg-muted/80 border bg-transparent',
    soft: 'text-muted-foreground hover:text-foreground active:text-foreground hover:bg-muted/90 active:bg-muted/80 border bg-card',
    togglable:
      'hover:bg-muted/55 data-[drag-over]:bg-muted/55 active:bg-muted/40 text-muted-foreground hover:text-foreground active:text-foreground',
    toggled:
      'bg-muted/90 data-[drag-over]:bg-muted/90 active:bg-muted/75 text-muted-foreground hover:text-foreground active:text-foreground',
  },
}

const staticStyles = {
  base: 'rounded p-5 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  variant: {
    danger: 'bg-card border-danger text-danger border [&>svg]:text-current',
    default: 'bg-card border text-card-foreground',
  },
}

const popoverStyles = {
  content: [
    staticStyles.base,
    staticStyles.variant.default,
    'duration-150 z-50 min-w-52 overflow-hidden p-1',
  ],
  item: [
    interactiveStyles.base,
    interactiveStyles.variant.ghost,
    interactiveStyles.size.default,
    'duration-0 focus:bg-muted focus:text-accent-foreground text-foreground data-[variant=danger]:text-danger-foreground data-[variant=danger]:focus:bg-danger/10 data-[variant=danger]:bg-danger/10 data-[variant=danger]:focus:text-danger-foreground data-[variant=danger]:text-danger-foreground dark:data-[variant=danger]:focus:bg-danger/40 dark:data-[variant=danger]:bg-danger/40 relative flex cursor-default items-center p-1 px-2 outline-hidden transition-all select-none focus-visible:ring-0 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
}

const overlayStyles = 'fixed inset-0 z-50 bg-overlay'

export { interactiveStyles, overlayStyles, popoverStyles, staticStyles }
