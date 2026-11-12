import fs from 'fs';
import path from 'path';
import YAML from 'yamljs';

type Doc = {
  paths?: Record<string, unknown>;
  tags?: unknown[];
  components?: {
    schemas?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
  };
};

export const buildSwaggerDocument = () => {
  const dir = path.join(process.cwd(), 'src/docs');
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.swagger.yaml'))
    .sort();

  const merged = {
    openapi: '3.0.0',
    info: {
      title: 'البيه الطيار API',
      version: '1.0.0',
      description:
        'كل الفلوس بالقروش (أعداد صحيحة)، والنسب بالـ basis points (5% = 500).',
    },
    paths: {} as Record<string, unknown>,
    components: {
      schemas: {} as Record<string, unknown>,
      securitySchemes: {} as Record<string, unknown>,
    },
  };

  for (const f of files) {
    const doc = YAML.load(path.join(dir, f)) as Doc;
    Object.assign(merged.paths, doc.paths);
    Object.assign(merged.components.schemas, doc.components?.schemas);
    Object.assign(
      merged.components.securitySchemes,
      doc.components?.securitySchemes,
    );
  }
  return merged;
};
