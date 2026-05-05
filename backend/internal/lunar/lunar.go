package lunar

import (
	"errors"
	"time"
)

const (
	minYear = 1900
	maxYear = 2100
)

var lunarInfo = []int{
	0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
	0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
	0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
	0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
	0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
	0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
	0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
	0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
	0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
	0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
	0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
	0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
	0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
	0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
	0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
}

var shengXiao = []string{"鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"}
var tianGan = []string{"甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"}
var diZhi = []string{"子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"}
var lunarMonthNames = []string{"", "正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "冬月", "腊月"}
var lunarDayNames = []string{"", "初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
	"十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
	"廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"}

type Lunar struct {
	Year        int
	Month       int
	Day         int
	IsLeapMonth bool
}

type Solar struct {
	Year  int
	Month int
	Day   int
}

func (l *Lunar) String() string {
	leap := ""
	if l.IsLeapMonth {
		leap = "闰"
	}
	return leap + lunarMonthNames[l.Month] + lunarDayNames[l.Day]
}

func (l *Lunar) GanZhiYear() string {
	idx := (l.Year - 1984) % 60
	if idx < 0 {
		idx += 60
	}
	return tianGan[idx%10] + diZhi[idx%12]
}

func (l *Lunar) ShengXiao() string {
	idx := (l.Year - 1900) % 12
	if idx < 0 {
		idx += 12
	}
	return shengXiao[idx]
}

func (l *Lunar) MonthName() string {
	if l.IsLeapMonth {
		return "闰" + lunarMonthNames[l.Month]
	}
	return lunarMonthNames[l.Month]
}

func (l *Lunar) DayName() string {
	return lunarDayNames[l.Day]
}

func getLeapMonth(year int) int {
	if year < minYear || year > maxYear {
		return 0
	}
	return lunarInfo[year-minYear] & 0xf
}

func getLunarMonthDays(year int, month int, isLeap bool) int {
	if year < minYear || year > maxYear {
		return 0
	}
	leapMonth := getLeapMonth(year)
	if isLeap && month != leapMonth {
		return 0
	}
	
	info := lunarInfo[year-minYear]
	bit := 16
	if leapMonth > 0 && month > leapMonth {
		bit++
	} else if leapMonth > 0 && month == leapMonth && isLeap {
		bit++
	}
	return 29 + ((info >> bit) & 1)
}

func getLunarYearDays(year int) int {
	sum := 348
	for i := 0x8000; i > 0x8; i >>= 1 {
		if lunarInfo[year-minYear]&i != 0 {
			sum += 1
		}
	}
	return sum + getLeapDays(year)
}

func getLeapDays(year int) int {
	if getLeapMonth(year) != 0 {
		if (lunarInfo[year-minYear] & 0x10000) != 0 {
			return 30
		}
		return 29
	}
	return 0
}

func SolarToLunar(solar Solar) (*Lunar, error) {
	if solar.Year < minYear || solar.Year > maxYear {
		return nil, errors.New("year out of range (1900-2100)")
	}

	baseDate := time.Date(minYear, 1, 31, 0, 0, 0, 0, time.UTC)
	targetDate := time.Date(solar.Year, time.Month(solar.Month), solar.Day, 0, 0, 0, 0, time.UTC)
	offset := int(targetDate.Sub(baseDate).Hours() / 24)

	lunar := &Lunar{Year: minYear}
	
	for lunar.Year < maxYear && offset > getLunarYearDays(lunar.Year) {
		offset -= getLunarYearDays(lunar.Year)
		lunar.Year++
	}

	leapMonth := getLeapMonth(lunar.Year)
	lunar.IsLeapMonth = false

	for lunar.Month = 1; lunar.Month < 13; lunar.Month++ {
		if leapMonth > 0 && lunar.Month == (leapMonth+1) && !lunar.IsLeapMonth {
			lunar.Month--
			lunar.IsLeapMonth = true
		}
		
		days := getLunarMonthDays(lunar.Year, lunar.Month, lunar.IsLeapMonth)
		if offset < days {
			break
		}
		offset -= days
		
		if lunar.IsLeapMonth && lunar.Month == leapMonth {
			lunar.IsLeapMonth = false
		}
	}

	lunar.Day = offset + 1
	return lunar, nil
}

func LunarToSolar(lunar Lunar) (*Solar, error) {
	if lunar.Year < minYear || lunar.Year > maxYear {
		return nil, errors.New("year out of range (1900-2100)")
	}

	leapMonth := getLeapMonth(lunar.Year)
	if lunar.IsLeapMonth && leapMonth != lunar.Month {
		return nil, errors.New("invalid leap month")
	}

	offset := 0
	for year := minYear; year < lunar.Year; year++ {
		offset += getLunarYearDays(year)
	}

	isLeap := false
	for month := 1; month < lunar.Month || (month == lunar.Month && isLeap != lunar.IsLeapMonth); month++ {
		if leapMonth > 0 && month == leapMonth && !isLeap {
			isLeap = true
			month--
		} else {
			isLeap = false
		}
		offset += getLunarMonthDays(lunar.Year, month, isLeap)
	}

	offset += lunar.Day - 1

	baseDate := time.Date(minYear, 1, 31, 0, 0, 0, 0, time.UTC)
	solarDate := baseDate.AddDate(0, 0, offset)

	return &Solar{
		Year:  solarDate.Year(),
		Month: int(solarDate.Month()),
		Day:   solarDate.Day(),
	}, nil
}

func GetLunarInfo(year int, month int, day int) (map[string]interface{}, error) {
	lunar, err := SolarToLunar(Solar{Year: year, Month: month, Day: day})
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"lunar_year":        lunar.Year,
		"lunar_month":       lunar.Month,
		"lunar_day":         lunar.Day,
		"is_leap_month":     lunar.IsLeapMonth,
		"gan_zhi_year":      lunar.GanZhiYear(),
		"sheng_xiao":        lunar.ShengXiao(),
		"month_name":        lunar.MonthName(),
		"day_name":          lunar.DayName(),
		"full_lunar_string": lunar.String(),
	}, nil
}

func ConvertLunarToSolar(year int, month int, day int, isLeap bool) (map[string]interface{}, error) {
	solar, err := LunarToSolar(Lunar{Year: year, Month: month, Day: day, IsLeapMonth: isLeap})
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"solar_year":  solar.Year,
		"solar_month": solar.Month,
		"solar_day":   solar.Day,
	}, nil
}
