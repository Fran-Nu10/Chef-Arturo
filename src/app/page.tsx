import { Header } from '@/components/layout/Header'
import { BarraCarrito } from '@/components/layout/Carrito'
import { VitrinaViva } from '@/components/home/VitrinaViva'
import { ElegiTuOcasion } from '@/components/home/ElegiTuOcasion'
import { SeleccionDeLaCasa } from '@/components/home/SeleccionDeLaCasa'
import { ElDetalleFinal } from '@/components/home/ElDetalleFinal'
import { ArmaTuOcasion } from '@/components/home/ArmaTuOcasion'
import { FechasQueImportan } from '@/components/home/FechasQueImportan'
import { DeLaCocinaATuMesa } from '@/components/home/DeLaCocinaATuMesa'
import { LaMesaDeChefArturo } from '@/components/home/LaMesaDeChefArturo'
import { InformacionParaPedir } from '@/components/home/InformacionParaPedir'
import { CierreEditorial } from '@/components/home/CierreEditorial'
import { seleccionDeLaCasa } from '@/server/storefront/consultas'

/**
 * Home — una narrativa visual continua, no una colección de secciones sueltas.
 *
 * Dos picos de movimiento (01 La Vitrina Viva y 04 El detalle final) y, entre
 * ellos, movimiento breve y comercial: transiciones de categoría, crossfades,
 * reveals de encabezado, carruseles nativos y rieles con deriva leve.
 */
export default async function Home() {
  // Los productos salen de la base. Si todavía no hay ninguno cargado, la
  // sección lo dice: no se completa con ejemplos.
  const seleccion = await seleccionDeLaCasa()

  return (
    <>
      <Header />
      <main className="pb-[52px] lg:pb-0">
        <VitrinaViva />
        <ElegiTuOcasion />
        <SeleccionDeLaCasa seleccion={seleccion} />
        <ElDetalleFinal />
        <ArmaTuOcasion />
        <FechasQueImportan />
        <DeLaCocinaATuMesa />
        <LaMesaDeChefArturo />
        <InformacionParaPedir />
        <CierreEditorial />
      </main>
      <BarraCarrito />
    </>
  )
}
