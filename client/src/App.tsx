import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import NavigationMenu from "@/components/navigation-menu";
import MysticalFooter from "@/components/mystical-footer";

// Pages
import Home from "@/pages/home";
import Auth from "@/pages/auth";
import LibriTenebris from "@/pages/libri-tenebris";
import LectorGrimorio from "@/pages/lector-grimorio";
import Bibliotheca from "@/pages/bibliotheca";
import OracleChat from "@/pages/oracle-chat";
import AdminOraculum from "@/pages/admin-oraculum";
import OracleEspelhoNegro from "@/pages/oracle-espelho-negro";
import OracleTarotInfernal from "@/pages/oracle-tarot-infernal";
import OracleChamasInfernais from "@/pages/oracle-chamas-infernais";
import OracleAguasSombrias from "@/pages/oracle-aguas-sombrias";
import OracleGuardiaoAbismo from "@/pages/oracle-guardiao-abismo";

import Profilus from "@/pages/profilus";
import Initiatio from "@/pages/initiatio";
import Cursus from "@/pages/cursus";
// import CursusDetalhe from "@/pages/cursus-detalhe"; // Arquivo não existe mais
import CursoDetalhe from "@/pages/curso-detalhe";

import CursusLeitor from "@/pages/cursus-leitor";
import MeusCursos from "@/pages/meus-cursos";
import Admin from "@/pages/admin";
import AdminCourses from "@/pages/admin-courses";
import AdminModules from "@/pages/admin-modules";
import AdminLibri from "@/pages/admin-libri";
import Oraculum from "@/pages/oraculum";
import VoxPluma from "@/pages/vox-pluma";
import DeTemplo from "@/pages/de-templo";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
          <div className="min-h-screen relative bg-black">
            {/* Background rotating seal */}
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
              <img 
                src="https://i.postimg.cc/g20gqmdX/IMG-20250527-182235-1.png" 
                alt="Templo do Abismo" 
                className="w-96 h-96 opacity-10 animate-spin"
                style={{ 
                  animationDuration: '60s',
                  filter: 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)' 
                }}
              />
            </div>

            {/* Navigation */}
            <NavigationMenu />

            {/* Main Content */}
            <main className="relative z-10">
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/auth" component={Auth} />
                <Route path="/libri-tenebris" component={LibriTenebris} />
                <Route path="/lector-grimorio/:id" component={LectorGrimorio} />
                <Route path="/bibliotheca" component={Bibliotheca} />
                <Route path="/profilus" component={Profilus} />

                <Route path="/initiatio">
                  {() => {
                    const { user } = useAuth();
                    
                    // Se já completou a iniciação, redirecionar para cursus
                    if (user?.initiation_completed === true || user?.role !== 'buscador') {
                      window.location.href = '/cursus';
                      return null;
                    }
                    
                    return <Initiatio />;
                  }}
                </Route>
                <Route path="/cursus" component={Cursus} />
                {/* <Route path="/cursus-detalhe/:slug" component={CursusDetalhe} /> */}
                <Route path="/curso-detalhe/:id" component={CursoDetalhe} />

                <Route path="/cursus-leitor/:slug" component={CursusLeitor} />
                <Route path="/meus-cursos" component={MeusCursos} />
                <Route path="/admin" component={Admin} />
                <Route path="/admin-courses" component={AdminCourses} />
                <Route path="/admin-modules" component={AdminModules} />
                <Route path="/admin/libri" component={AdminLibri} />
                <Route path="/admin/oraculum" component={AdminOraculum} />
                <Route path="/oraculum" component={Oraculum} />
                <Route path="/speculum-nigrum" component={OracleEspelhoNegro} />
                <Route path="/tarotum-infernalis" component={OracleTarotInfernal} />
                <Route path="/flammae-infernales" component={OracleChamasInfernais} />
                <Route path="/aquae-tenebrosae" component={OracleAguasSombrias} />
                <Route path="/custos-abyssi" component={OracleGuardiaoAbismo} />
                <Route path="/chat/:sessionToken" component={OracleChat} />
                <Route path="/vox-pluma" component={VoxPluma} />
                <Route path="/de-templo" component={DeTemplo} />
                <Route>
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-cinzel text-golden-amber mb-4">404</h1>
                      <p className="text-ritualistic-beige/70">Página não encontrada nos mistérios</p>
                    </div>
                  </div>
                </Route>
              </Switch>
            </main>

            {/* Footer */}
            <MysticalFooter />

            <Toaster />
          </div>
        </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;