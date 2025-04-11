import { format } from "date-fns"

export async function get_weather({
    latitude,
    longitude,
    date,
}: {
    latitude: number
    longitude: number
    date: Date
}) {
    const formatted_date = format(date, "yyyy-MM-dd")
    const api_url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&start_date=${formatted_date}&end_date=${formatted_date}&timezone=auto`

    const response = await fetch(api_url)
    const data = await response.json()

    const processed = {
        max_temp: data.daily.temperature_2m_max[0],
        min_temp: data.daily.temperature_2m_min[0],
        rain_prob: data.daily.precipitation_probability_max[0],
        rain_total: data.daily.precipitation_sum[0],
    }

    const summary = `The temperature will range from ${processed.min_temp}°C to ${processed.max_temp}°C with a ${processed.rain_prob}% chance of rain and ${processed.rain_total}mm of precipitation.`

    return summary

    // return {
    //     raw: data,
    //     processed,
    //     summary,
    // }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const out = await get_weather({
        latitude: 37.7749,
        longitude: -122.4194,
        date: new Date("2025-04-10"),
    })

    console.log(JSON.stringify(out, null, 4))
}
