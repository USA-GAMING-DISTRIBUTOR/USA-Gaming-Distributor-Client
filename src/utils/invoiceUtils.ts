import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabase';

export const generateInvoiceImage = async (invoiceElement: HTMLElement): Promise<string | null> => {
  try {
    // Generate canvas from HTML element
    const canvas = await html2canvas(invoiceElement, {
      useCORS: true,
      allowTaint: false,
      width: invoiceElement.offsetWidth,
      height: invoiceElement.offsetHeight,
    });

    // Convert canvas to blob
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png', 0.9),
    );

    if (!blob) {
      throw new Error('Failed to generate invoice image');
    }

    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error generating invoice image:', error);
    return null;
  }
};

export const uploadInvoiceToStorage = async (
  invoiceElement: HTMLElement,
  orderId: string,
): Promise<string | null> => {
  try {
    // Generate canvas from HTML element
    const canvas = await html2canvas(invoiceElement, {
      useCORS: true,
      allowTaint: false,
      width: invoiceElement.offsetWidth,
      height: invoiceElement.offsetHeight,
    });

    // Convert canvas to blob
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png', 0.9),
    );

    if (!blob) {
      throw new Error('Failed to generate invoice image');
    }

    // Upload to Supabase storage
    const fileName = `invoice-${orderId}.png`;
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('invoices')
      .upload(fileName, blob, { upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    if (!uploadData) {
      throw new Error('No upload data returned');
    }

    // Get public URL
    const { data: publicData } = supabase.storage.from('invoices').getPublicUrl(fileName);

    if (!publicData || !publicData.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    return publicData.publicUrl;
  } catch (error) {
    console.error('Error uploading invoice to storage:', error);
    return null;
  }
};

export const copyInvoiceToClipboard = async (invoiceElement: HTMLElement): Promise<boolean> => {
  try {
    // Check clipboard permissions
    if (!navigator.clipboard || !navigator.clipboard.write) {
      throw new Error('Clipboard API not supported');
    }

    // Generate canvas from HTML element
    const canvas = await html2canvas(invoiceElement, {
      useCORS: true,
      allowTaint: false,
      width: invoiceElement.offsetWidth,
      height: invoiceElement.offsetHeight,
    });

    // Convert canvas to blob
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png', 0.9),
    );

    if (!blob) {
      throw new Error('Failed to generate invoice image');
    }

    // Copy to clipboard
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);

    return true;
  } catch (error) {
    console.error('Error copying invoice to clipboard:', error);
    return false;
  }
};

export const downloadInvoiceImage = async (
  invoiceElement: HTMLElement,
  orderId: string,
): Promise<boolean> => {
  try {
    // Generate canvas from HTML element
    const canvas = await html2canvas(invoiceElement, {
      useCORS: true,
      allowTaint: false,
      width: invoiceElement.offsetWidth,
      height: invoiceElement.offsetHeight,
    });

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL('image/png', 0.9);

    // Create download link
    const link = document.createElement('a');
    link.download = `invoice-${orderId}.png`;
    link.href = dataUrl;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error('Error downloading invoice:', error);
    return false;
  }
};
