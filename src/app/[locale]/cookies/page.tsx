import { createLegalPage } from '@/lib/legal/create-legal-page';

const page = createLegalPage('cookies');
export const generateMetadata = page.generateMetadata;
export default page.default;
