import { NextResponse } from 'next/server';
import { getVehicleByQrCode } from '@/lib/services/vehicles';

export async function GET(
  _request: Request,
  props: { params: Promise<{ vehicleId: string }> },
) {
  const { vehicleId } = await props.params;
  const vehicle = await getVehicleByQrCode(vehicleId);

  if (!vehicle) {
    return NextResponse.redirect(new URL('/vehicles', _request.url));
  }

  return NextResponse.redirect(new URL(`/vehicles/${vehicle.id}`, _request.url));
}
