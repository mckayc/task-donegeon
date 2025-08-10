import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { GameAsset } from '../../types';
import Button from '../user-interface/Button';
import Card from '../user-interface/Card';
import ConfirmDialog from '../user-interface/ConfirmDialog';
import EditGameAssetDialog from '../admin/EditGameAssetDialog';
import EmptyState from '../user-interface/EmptyState';
import { ItemManagerIcon, EllipsisVerticalIcon } from '../user-interface/Icons';
import ItemIdeaGenerator from '../quests/ItemIdeaGenerator';
import Input from '../user-interface/Input';
import ImagePreviewDialog from '../user-interface/ImagePreviewDialog';
import { useDebounce } from '../../hooks/useDebounce';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useEconomyState } from '../../context/EconomyContext';
import UploadWithCategoryDialog from '../admin/UploadWithCategoryDialog';
import { useShiftSelect } from '../../hooks/useShiftSelect';

const ManageItemsPage: React.FC = () => {
    const { settings, isAiConfigured } = useAppState();
    const { uploadFile } = useAppDispatch();
    const { gameAssets: allGameAssets } = useEconomyState();
    const { addNotification } = useNotificationsDispatch();
    
    const [pageAssets, setPageAssets] = useState<GameAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingAsset, setEditingAsset] = useState<GameAsset | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [confirmation, setConfirmation] = useState<{ action: 'delete', ids: string[] } | null>(null);
    const [initialCreateData, setInitialCreateData] = useState<any | null>(null);
    const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'createdAt-desc' | 'createdAt-asc' | 'name-asc' | 'name-desc'>('createdAt-desc');
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const [isDragging, setIsDragging] = useState(false);
    const [fileToCategorize