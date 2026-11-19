// UTC calendar-month arithmetic for V COIN founder vesting.
// Month offsets are calendar months, not fixed 30-day intervals.
// Inputs are Unix timestamps at or after 1970-01-01 UTC.

struct VcoinCivilDate {
    year: int
    month: int
    day: int
}

const VCOIN_SECONDS_PER_DAY = 86400
const VCOIN_UNIX_EPOCH_CIVIL_OFFSET = 719468

fun vcoinIsLeapYear(year: int): bool {
    return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
}

fun vcoinDaysInMonth(year: int, month: int): int {
    if (month == 2) {
        return vcoinIsLeapYear(year) ? 29 : 28;
    }
    if (month == 4 || month == 6 || month == 9 || month == 11) {
        return 30;
    }
    return 31;
}

fun vcoinCivilDateFromUnixDays(unixDays: int): VcoinCivilDate {
    val z = unixDays + VCOIN_UNIX_EPOCH_CIVIL_OFFSET;
    val era = z / 146097;
    val dayOfEra = z - era * 146097;
    val yearOfEra = (dayOfEra - dayOfEra / 1460 + dayOfEra / 36524 - dayOfEra / 146096) / 365;
    var year = yearOfEra + era * 400;
    val dayOfYear = dayOfEra - (365 * yearOfEra + yearOfEra / 4 - yearOfEra / 100);
    val monthPrime = (5 * dayOfYear + 2) / 153;
    val day = dayOfYear - (153 * monthPrime + 2) / 5 + 1;
    val month = monthPrime < 10 ? monthPrime + 3 : monthPrime - 9;
    if (month <= 2) {
        year += 1;
    }
    return {
        year,
        month,
        day,
    };
}

fun vcoinUnixDaysFromCivilDate(yearInput: int, month: int, day: int): int {
    val year = month <= 2 ? yearInput - 1 : yearInput;
    val era = year / 400;
    val yearOfEra = year - era * 400;
    val monthPrime = month > 2 ? month - 3 : month + 9;
    val dayOfYear = (153 * monthPrime + 2) / 5 + day - 1;
    val dayOfEra = yearOfEra * 365 + yearOfEra / 4 - yearOfEra / 100 + dayOfYear;
    return era * 146097 + dayOfEra - VCOIN_UNIX_EPOCH_CIVIL_OFFSET;
}

fun vcoinMonthlyVestingDueTimestamp(startTimestamp: int, monthOffset: int): int {
    val unixDays = startTimestamp / VCOIN_SECONDS_PER_DAY;
    val secondsOfDay = startTimestamp % VCOIN_SECONDS_PER_DAY;
    val startDate = vcoinCivilDateFromUnixDays(unixDays);
    val absoluteMonth = startDate.year * 12 + startDate.month - 1 + monthOffset;
    val dueYear = absoluteMonth / 12;
    val dueMonth = absoluteMonth % 12 + 1;
    val lastDay = vcoinDaysInMonth(dueYear, dueMonth);
    val dueDay = startDate.day > lastDay ? lastDay : startDate.day;
    return vcoinUnixDaysFromCivilDate(dueYear, dueMonth, dueDay) * VCOIN_SECONDS_PER_DAY +
        secondsOfDay;
}
