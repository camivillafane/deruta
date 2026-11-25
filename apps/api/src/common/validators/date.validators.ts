import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsFutureDateString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isFutureDateString',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          if (typeof value !== 'string') return false;
          const date = new Date(value);
          if (isNaN(date.getTime())) return false;
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          return date >= now;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe ser una fecha válida en el futuro`;
        },
      },
    });
  };
}

export function IsTimeString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isTimeString',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          if (typeof value !== 'string') return false;
          return /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe tener formato HH:MM o HH:MM:SS`;
        },
      },
    });
  };
}
