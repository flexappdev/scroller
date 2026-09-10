"use client";

import CardActions from "@/components/CardActions";

export default function ItemActionsClient({ id }: { id: string; scrollerHref?: string }) {
  return <CardActions id={id} size={16} />;
}
