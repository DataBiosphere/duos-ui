import React from 'react'
import { Card, CardProps } from 'src/components/showcase/primitives/Card'

export type FeaturedCardProps = Omit<CardProps, 'variant'>

/** The large card variant: wider padding, a tinted background with a stronger border, and media beside the text on wide screens. */
export const FeaturedCard = (props: FeaturedCardProps) => <Card {...props} variant="featured" />
