'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Select, Button, Dropdown, type DropdownItem, cn } from '@todo/ui-web';
import { useThemeContext, type DaisyUITheme } from './ThemeProvider';

const themeSwitcherVariants = cva('theme-switcher', {
  variants: {
    variant: {
      dropdown: 'dropdown',
      select: 'form-control',
      buttons: 'btn-group',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    variant: 'select',
    size: 'md',
  },
});

export interface ThemeSwitcherProps extends VariantProps<typeof themeSwitcherVariants> {
  className?: string;
  showLabel?: boolean;
  groupThemes?: boolean;
  customThemes?: string[];
  'data-testid'?: string;
}

export function ThemeSwitcher({
  variant = 'select',
  size = 'md',
  className,
  showLabel = true,
  groupThemes = true,
  customThemes,
  'data-testid': testId,
}: ThemeSwitcherProps) {
  const { daisyUITheme, setTheme, setDaisyUITheme } = useThemeContext();
  const theme = daisyUITheme as DaisyUITheme;

  // All available DaisyUI themes
  const allThemes: DaisyUITheme[] = (customThemes as DaisyUITheme[]) || [
    'light',
    'dark',
    'cupcake',
    'bumblebee',
    'emerald',
    'corporate',
    'synthwave',
    'retro',
    'cyberpunk',
    'valentine',
    'halloween',
    'garden',
    'forest',
    'aqua',
    'lofi',
    'pastel',
    'fantasy',
    'wireframe',
    'black',
    'luxury',
    'dracula',
    'cmyk',
    'autumn',
    'business',
    'acid',
    'lemonade',
    'night',
    'coffee',
    'winter',
    'dim',
    'nord',
    'sunset',
  ];

  const handleThemeChange = (newTheme: string) => {
    if (setDaisyUITheme) {
      setDaisyUITheme(newTheme as DaisyUITheme);
      return;
    }

    setTheme(newTheme as DaisyUITheme);
  };

  const formatThemeName = (themeName: string) => {
    return themeName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Dark themes for grouping
  const darkThemesList = [
    'dark',
    'synthwave',
    'halloween',
    'forest',
    'black',
    'luxury',
    'dracula',
    'night',
    'coffee',
    'dim',
  ];

  const groupedThemes = groupThemes
    ? {
        light: allThemes.filter(t => !darkThemesList.includes(t)),
        dark: allThemes.filter(t => darkThemesList.includes(t)),
      }
    : null;

  if (variant === 'select') {
    return (
      <div className={cn(themeSwitcherVariants({ variant, size }), className)} data-testid={testId}>
        {showLabel && (
          <label className="label">
            <span className="label-text">Theme</span>
          </label>
        )}
        <Select
          value={theme}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleThemeChange(e.target.value)}
          className={cn('select-bordered', {
            'select-sm': size === 'sm',
            'select-lg': size === 'lg',
          })}
        >
          {groupedThemes ? (
            <>
              <optgroup label="Light Themes">
                {groupedThemes.light.map(themeName => (
                  <option key={themeName} value={themeName}>
                    {formatThemeName(themeName)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Dark Themes">
                {groupedThemes.dark.map(themeName => (
                  <option key={themeName} value={themeName}>
                    {formatThemeName(themeName)}
                  </option>
                ))}
              </optgroup>
            </>
          ) : (
            allThemes.map(themeName => (
              <option key={themeName} value={themeName}>
                {formatThemeName(themeName)}
              </option>
            ))
          )}
        </Select>
      </div>
    );
  }

  if (variant === 'dropdown') {
    // Create dropdown items for the current Dropdown API
    const createDropdownItems = (): DropdownItem[] => {
      if (groupedThemes) {
        return [
          ...groupedThemes.light.map((themeName: string) => ({
            id: `light-${themeName}`,
            label: formatThemeName(themeName),
            onSelect: () => handleThemeChange(themeName),
          })),
          ...groupedThemes.dark.map((themeName: string) => ({
            id: `dark-${themeName}`,
            label: formatThemeName(themeName),
            onSelect: () => handleThemeChange(themeName),
          })),
        ];
      }
      return allThemes.map(themeName => ({
        id: themeName,
        label: formatThemeName(themeName),
        onSelect: () => handleThemeChange(themeName),
      }));
    };

    return (
      <div className={cn(themeSwitcherVariants({ variant, size }), className)} data-testid={testId}>
        <Dropdown items={createDropdownItems()} label={formatThemeName(theme)} />
      </div>
    );
  }

  if (variant === 'buttons') {
    const displayThemes = groupThemes && groupedThemes ? [...groupedThemes.light, ...groupedThemes.dark] : allThemes;

    return (
      <div className={cn(themeSwitcherVariants({ variant, size }), className)} data-testid={testId}>
        {showLabel && (
          <div className="label">
            <span className="label-text">Theme</span>
          </div>
        )}
        <div className="btn-group flex-wrap gap-1">
          {displayThemes.slice(0, 6).map((themeName: string) => (
            <Button
              key={themeName}
              variant={themeName === theme ? 'primary' : 'ghost'}
              size={size}
              onClick={() => handleThemeChange(themeName)}
              className="btn-sm"
            >
              {formatThemeName(themeName)}
            </Button>
          ))}
          {displayThemes.length > 6 && (
            <Dropdown
              items={displayThemes.slice(6).map((themeName: string) => ({
                id: themeName,
                label: formatThemeName(themeName),
                onSelect: () => handleThemeChange(themeName),
              }))}
              label="More..."
            />
          )}
        </div>
      </div>
    );
  }

  // Default fallback to select variant
  return (
    <div className={cn(themeSwitcherVariants({ variant: 'select', size }), className)} data-testid={testId}>
      {showLabel && (
        <label className="label">
          <span className="label-text">Theme</span>
        </label>
      )}
      <Select
        value={theme}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleThemeChange(e.target.value)}
        className="select-bordered"
      >
        {allThemes.map(themeName => (
          <option key={themeName} value={themeName}>
            {formatThemeName(themeName)}
          </option>
        ))}
      </Select>
    </div>
  );
}
