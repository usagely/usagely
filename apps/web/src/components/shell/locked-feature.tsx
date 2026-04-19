'use client';

import { Icon } from '@/src/components/ui/icon';
import { Button } from '@/components/ui/button';

const ENTERPRISE_FEATURES = [
  'Shadow AI detection via egress & expense feeds',
  '30-day rolling AI forecast with scenarios',
  'Tool request & approval workflows',
  'ML-powered optimization recommendations',
  'SAML SSO & SCIM provisioning',
  'SOC 2 Type II audited hosting',
];

interface LockedFeatureProps {
  name: string;
  description: string;
}

export function LockedFeature({ name, description }: LockedFeatureProps) {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-[560px] mx-auto mt-10 rounded-xl border border-[var(--hairline)] bg-[var(--surface)] p-10 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[var(--surface-2)]">
          <Icon name="lock" size={22} />
        </div>

        <div className="text-lg font-medium tracking-tight">
          {name} is an Enterprise feature
        </div>
        <div className="mt-1.5 text-[13px] text-[var(--muted)]">
          {description}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5 text-left">
          {ENTERPRISE_FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2 text-xs">
              <Icon name="approve" size={13} />
              {f}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          <Button variant="outline">Read docs</Button>
          <Button>Talk to sales</Button>
        </div>
      </div>
    </div>
  );
}
