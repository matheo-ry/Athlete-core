import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';

import { logger } from '../lib';
import { SkeletonCard } from '../ui';

import type { HomeCard } from './module-manifest';

/**
 * Una tarjeta del inicio que aporta un módulo (PR 2.18): su código se carga
 * al pintarla. Si no se puede cargar, no se enseña nada: el inicio sigue
 * sirviendo, y el error queda registrado.
 */
export function HomeCardContent({ card }: { card: HomeCard }) {
  const [loaded, setLoaded] = useState<{ card: HomeCard; Component: ComponentType } | null>(null);
  const [failed, setFailed] = useState<HomeCard | null>(null);

  useEffect(() => {
    let isCurrent = true;
    card
      .lazy()
      .then(({ Component }) => {
        if (isCurrent) {
          setLoaded({ card, Component });
        }
      })
      .catch((error: unknown) => {
        logger.error('Could not load a home card', {
          card: card.key,
          message: error instanceof Error ? error.message : 'unknown',
        });
        if (isCurrent) {
          setFailed(card);
        }
      });
    return () => {
      isCurrent = false;
    };
  }, [card]);

  if (failed === card) {
    return null;
  }
  if (loaded === null || loaded.card !== card) {
    return <SkeletonCard />;
  }
  const { Component } = loaded;
  return <Component />;
}
