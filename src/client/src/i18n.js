import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          'All Levels': 'All Levels',
          'Entry Level': 'Entry Level',
          'Mid Level': 'Mid Level',
          'Senior Level': 'Senior Level',
          'Executive': 'Executive',
          'Recommendations': 'Recommendations',
          'View Details': 'View Details',
          'Refresh recommendations': 'Refresh recommendations',
          'Saved Jobs': 'Saved Jobs',
          'Market Insights': 'Market Insights',
          'Hot Skills': 'Hot Skills',
          'Average Salary': 'Average Salary',
          'Job Growth': 'Job Growth',
          'Remote Only': 'Remote Only',
          'All Types': 'All Types',
          'Full-time': 'Full-time',
          'Part-time': 'Part-time',
          'Contract': 'Contract',
          'Internship': 'Internship',
          'Salary Range': 'Salary Range',
          'Job Type': 'Job Type',
          'Experience Level': 'Experience Level',
          'Filters': 'Filters',
          'Search': 'Search',
          'Job Search': 'Job Search',
          'All Results': 'All Results',
          'LinkedIn': 'LinkedIn',
          'AI Enhanced': 'AI Enhanced',
          'Recommended': 'Recommended',
          'Apply Now': 'Apply Now',
          'Apply on LinkedIn': 'Apply on LinkedIn'
        }
      }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;