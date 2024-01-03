interface ControlledComponentProps {
  value: Date | null;
  onChange: (value: Date) => void;
}

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'short' });

export function ControlledComponent({ onChange, value }: ControlledComponentProps) {
  const DATES = [
    new Date(2023, 0, 1),
    new Date(2023, 0, 2),
    new Date(2023, 0, 3),
    new Date(2023, 0, 4),
    new Date(2023, 0, 5),
    new Date(2023, 0, 6),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
      {DATES.map((date) => {
        const active = value?.getTime() === date.getTime();
        return (
          <button
            type="button"
            className="button"
            key={date.getTime()}
            style={active ? {} : { background: '#2e2c2c' }}
            onClick={() => onChange(date)}
          >
            {dateFormatter.format(date)}
          </button>
        );
      })}
    </div>
  );
}
