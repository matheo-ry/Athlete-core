import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FeatureGate } from './FeatureGate';
import { StaticFlagsProvider } from './StaticFlagsProvider';

const ENABLED = new Set(['example_feature']);

describe('FeatureGate', () => {
  it('muestra el contenido cuando la función está activa', () => {
    render(
      <StaticFlagsProvider enabledFeatures={ENABLED}>
        <FeatureGate feature="example_feature">visible</FeatureGate>
      </StaticFlagsProvider>,
    );

    expect(screen.getByText('visible')).toBeInTheDocument();
  });

  it('muestra la alternativa cuando la función está apagada o no existe', () => {
    render(
      <StaticFlagsProvider enabledFeatures={ENABLED}>
        <FeatureGate feature="unknown_feature" fallback="off">
          visible
        </FeatureGate>
      </StaticFlagsProvider>,
    );

    expect(screen.queryByText('visible')).not.toBeInTheDocument();
    expect(screen.getByText('off')).toBeInTheDocument();
  });
});
