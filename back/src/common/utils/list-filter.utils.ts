import { Types } from 'mongoose';

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
}

export function parseCreatedAtFilter(
  value?: string,
): { $gte: Date; $lt: Date } | null {
  if (!value?.trim()) return null;

  const trimmed = value.trim();
  let year: number;
  let month: number;
  let day: number;

  const dotted = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmed);
  const dashed = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

  if (dotted) {
    day = Number(dotted[1]);
    month = Number(dotted[2]);
    year = Number(dotted[3]);
  } else if (dashed) {
    year = Number(dashed[1]);
    month = Number(dashed[2]);
    day = Number(dashed[3]);
  } else {
    return null;
  }

  const start = new Date(year, month - 1, day);
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(year, month - 1, day + 1);
  return { $gte: start, $lt: end };
}

export function buildIdFilter(id?: string): Record<string, unknown> | null {
  if (!id?.trim()) return null;

  const trimmed = id.trim();
  if (Types.ObjectId.isValid(trimmed)) {
    return { _id: new Types.ObjectId(trimmed) };
  }

  return {
    $expr: {
      $regexMatch: {
        input: { $toString: '$_id' },
        regex: escapeRegex(trimmed),
        options: 'i',
      },
    },
  };
}
