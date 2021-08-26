export enum size {
  Bytes = 0,
  KB,
  MB,
  GB,
  TB,
  PB,
  EB,
  ZB,
  YB,
}

export const formatFileSize = (
  bytes: number,
  decimalPoint?: number
): { size: number; unit: size } => {
  if (bytes == 0) return { size: 0, unit: size.Bytes };
  var k = 1000,
    dm = decimalPoint || 2,
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return {
    size: parseFloat((bytes / Math.pow(k, i)).toFixed(dm)),
    unit: size[size[i]],
  };
};
