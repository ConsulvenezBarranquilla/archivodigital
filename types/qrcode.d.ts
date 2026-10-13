declare module "qrcode" {
  interface QRCodeOptions {
    type?: "png";
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    margin?: number;
    width?: number;
  }

  interface QRCodeApi {
    toBuffer(
      text: string,
      options?: QRCodeOptions
    ): Promise<Buffer>;
  }

  const QRCode: QRCodeApi;
  export default QRCode;
}
