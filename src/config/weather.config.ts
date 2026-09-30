export enum WeatherType {
  CLEAR = 'clear',               // Trời quang đãng
  RAIN = 'rain',                 // Mưa rào (tăng độ ẩm đất đai)
  THUNDERSTORM = 'thunderstorm', // Mưa dông sấm sét (tăng lôi linh khí, có sét đánh)
  SNOW = 'snow',                 // Tuyết rơi (giảm nhiệt độ, phủ trắng)
  FOG = 'fog',                   // Sương mù bao phủ
  DROUGHT = 'drought'            // Hạn hán oi ả (giảm độ ẩm đất, cây khô)
}

export interface WeatherProperties {
  id: WeatherType;
  name: string;
  description: string;
  tempOffset: number;        // Chênh lệch nhiệt độ (°C)
  moistureDelta: number;     // Thay đổi độ ẩm mỗi giây (+ hoặc -)
  particleType?: 'rain' | 'snow' | 'thunder' | 'fog';
  particleDensity: number;
}

export const WEATHER_CONFIGS: Record<WeatherType, WeatherProperties> = {
  [WeatherType.CLEAR]: {
    id: WeatherType.CLEAR,
    name: 'Trời Quang',
    description: 'Bầu trời trong xanh, vạn dặm không mây, vạn vật sinh trưởng bình hòa.',
    tempOffset: 0,
    moistureDelta: -0.0005,
    particleDensity: 0
  },
  [WeatherType.RAIN]: {
    id: WeatherType.RAIN,
    name: 'Mưa Rào',
    description: 'Mưa xuân/hạ tẩm bổ mặt đất, gia tăng độ ẩm giúp cây cối tốt tươi mau lớn.',
    tempOffset: -2,
    moistureDelta: 0.008,
    particleType: 'rain',
    particleDensity: 80
  },
  [WeatherType.THUNDERSTORM]: {
    id: WeatherType.THUNDERSTORM,
    name: 'Dông Sét',
    description: 'Mưa to gió lớn, thiên lôi cuồn cuộn, nồng độ Lôi linh khí tăng vọt, sấm sét giáng xuống ngẫu nhiên.',
    tempOffset: -4,
    moistureDelta: 0.015,
    particleType: 'thunder',
    particleDensity: 120
  },
  [WeatherType.SNOW]: {
    id: WeatherType.SNOW,
    name: 'Tuyết Rơi',
    description: 'Tuyết lạnh phủ trắng núi non, nhiệt độ hạ xuống dưới điểm đóng băng, sinh linh di chuyển chậm lại.',
    tempOffset: -10,
    moistureDelta: 0.002,
    particleType: 'snow',
    particleDensity: 90
  },
  [WeatherType.FOG]: {
    id: WeatherType.FOG,
    name: 'Sương Mù',
    description: 'Hơi nước ngưng tụ mịt mù, tầm nhìn hạn chế, linh khí ngưng tụ mờ ảo.',
    tempOffset: -1,
    moistureDelta: 0.001,
    particleType: 'fog',
    particleDensity: 30
  },
  [WeatherType.DROUGHT]: {
    id: WeatherType.DROUGHT,
    name: 'Hạn Hán',
    description: 'Nắng gắt như thiêu như đốt, sông suối đầm lầy cạn nước, cây cỏ dễ héo rũ.',
    tempOffset: +8,
    moistureDelta: -0.012,
    particleDensity: 0
  }
};
