import { createLegalPage } from '@/lib/legal/create-legal-page';

const page = createLegalPage('terms');
export const generateMetadata = page.generateMetadata;
export default page.default;
