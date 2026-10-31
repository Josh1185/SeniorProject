
import { describe, expect, it } from 'vitest';
import { groupEventsByDay } from './itineraryGrouping';

describe('groupEventsByDay', () => {
  it('includes every day in the trip range, even when there are no events', () => {
    const events = [
      {
        title: 'Museum',
        startDateTime: new Date('2026-11-12T10:00:00.000Z'),
      },
      {
        title: 'Dinner',
        startDateTime: new Date('2026-11-14T18:00:00.000Z'),
      },
    ];

    const result = groupEventsByDay(
      '2026-11-12',
      '2026-11-15',
      events,
    );

    expect(result.map((day) => day.date)).toEqual([
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
    ]);

    expect(result[0]!.events.map((event) => event.title)).toEqual([
      'Museum',
    ]);
    expect(result[1]!.events).toEqual([]);
    expect(result[2]!.events.map((event) => event.title)).toEqual([
      'Dinner',
    ]);
    expect(result[3]!.events).toEqual([]);
  });

  it('sorts events chronologically within each day', () => {
    const events = [
      {
        title: 'Dinner',
        startDateTime: new Date('2026-11-12T19:00:00.000Z'),
      },
      {
        title: 'Lunch',
        startDateTime: new Date('2026-11-12T12:00:00.000Z'),
      },
      {
        title: 'Breakfast',
        startDateTime: new Date('2026-11-12T08:00:00.000Z'),
      },
    ];

    const result = groupEventsByDay(
      '2026-11-12',
      '2026-11-12',
      events,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.events.map((event) => event.title)).toEqual([
      'Breakfast',
      'Lunch',
      'Dinner',
    ]);
  });

  it('returns an empty list when the trip range is empty', () => {
    const result = groupEventsByDay(
      '2026-11-15',
      '2026-11-12',
      [],
    );

    expect(result).toEqual([]);
  });
});
