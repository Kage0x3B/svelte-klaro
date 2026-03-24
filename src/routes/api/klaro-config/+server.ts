import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

const DEFAULT_API_URL = 'https://api.kiprotect.com';

export const GET: RequestHandler = async ({ url, fetch }) => {
    const id = url.searchParams.get('id');
    const configName = url.searchParams.get('name') || 'default';
    const apiUrl = url.searchParams.get('apiUrl') || DEFAULT_API_URL;

    if (!id) {
        error(400, 'Missing "id" query parameter');
    }

    const apiEndpoint = `${apiUrl}/v1/privacy-managers/${id}/config.json?name=${configName}`;

    const response = await fetch(apiEndpoint);

    if (!response.ok) {
        error(response.status, `Failed to load config: ${response.statusText}`);
    }

    const config = await response.json();
    return json(config);
};
